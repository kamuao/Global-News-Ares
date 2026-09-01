import { loadStore } from "./data.js";
import { createMap } from "./map.js";
import { createPanel } from "./panel.js";
import { sound } from "./sound.js";

const BIAS_LEGEND = [
  { id: "left", label: "Left" },
  { id: "lean-left", label: "Lean Left" },
  { id: "center", label: "Center" },
  { id: "lean-right", label: "Lean Right" },
  { id: "right", label: "Right" },
  { id: "state-run", label: "State-run" },
];

const CONFLICT_LEGEND = [
  { type: "war", glyph: "⚔", label: "Active War", color: "var(--accent-red)" },
  { type: "territorial-dispute", glyph: "⚠", label: "Territorial Dispute", color: "var(--accent-amber)" },
  { type: "occupied-territory", glyph: "⛓", label: "Occupied Territory", color: "var(--accent-purple)" },
  { type: "subregion", glyph: "📍", label: "Local Area Feed", color: "var(--accent-amber)" },
];

async function bootSequence() {
  const bootEl = document.getElementById("boot-screen");
  const logEl = document.getElementById("boot-log");
  const lines = [
    "ARES SYSTEM :: COLD START",
    "LOADING WORLD TOPOGRAPHY (Natural Earth, public domain) ......... OK",
    "LOADING SOURCE BIAS REGISTRY ...................................... OK",
    "LOADING CONFLICT / DISPUTE MARKERS ................................ OK",
    "ESTABLISHING SITREP FEEDS ......................................... OK",
    "READY.",
  ];
  for (const line of lines) {
    logEl.textContent += line + "\n";
    await new Promise((r) => setTimeout(r, 90));
  }
  await new Promise((r) => setTimeout(r, 250));
  bootEl.classList.add("hidden");
  setTimeout(() => bootEl.remove(), 600);
}

function startClock() {
  const el = document.getElementById("hud-clock");
  function tick() {
    const now = new Date();
    el.textContent = now.toISOString().slice(11, 19) + "Z";
  }
  tick();
  setInterval(tick, 1000);
}

function renderLegend(store) {
  const biasEl = document.getElementById("legend-bias");
  biasEl.innerHTML = BIAS_LEGEND.map(
    (b) => `<li><span class="legend-swatch bias-${b.id}" style="background:currentColor;color:var(--bias-${b.id})"></span>${b.label}</li>`
  ).join("");

  const conflictEl = document.getElementById("legend-conflicts");
  conflictEl.innerHTML = CONFLICT_LEGEND.map(
    (c) => `<li><span class="legend-icon" style="color:${c.color}">${c.glyph}</span>${c.label}</li>`
  ).join("");

  const catEl = document.getElementById("legend-categories");
  catEl.innerHTML = Object.values(store.categories)
    .map((c) => `<li><span class="legend-icon">${c.icon}</span>${c.label}</li>`)
    .join("");
}

function updateStatusBar(store) {
  const feedCount = Object.values(store.countries).filter((c) => c.hasData).length;
  document.getElementById("feed-count").textContent = feedCount;
  document.getElementById("conflict-count").textContent = store.conflicts.length;
  document.getElementById("last-sync").textContent = new Date().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setupSearch(store, { onCountry, onConflict, onSubregion }) {
  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");

  const index = [
    ...Object.values(store.countries).map((c) => ({ kind: "country", id: c.iso3, label: `${c.flag || ""} ${c.name}`, tag: c.hasData ? "FEED ACTIVE" : "NO FEED" })),
    ...Object.entries(store.subregions).map(([id, s]) => ({ kind: "subregion", id, label: `${s.flag || "📍"} ${s.name}`, tag: "LOCAL" })),
    ...store.conflicts.map((c) => ({ kind: "conflict", id: c.id, label: `${c.name}`, tag: c.type.replace("-", " ").toUpperCase() })),
  ];

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      results.hidden = true;
      results.innerHTML = "";
      return;
    }
    const matches = index.filter((r) => r.label.toLowerCase().includes(q)).slice(0, 8);
    if (!matches.length) {
      results.hidden = true;
      return;
    }
    results.innerHTML = matches
      .map((m) => `<div class="hud-search-result" data-kind="${m.kind}" data-id="${m.id}"><span>${m.label}</span><span class="tag">${m.tag}</span></div>`)
      .join("");
    results.hidden = false;
  }

  input.addEventListener("input", () => renderResults(input.value));
  input.addEventListener("focus", () => renderResults(input.value));
  document.addEventListener("click", (e) => {
    if (!results.contains(e.target) && e.target !== input) results.hidden = true;
  });

  results.addEventListener("click", (e) => {
    const row = e.target.closest(".hud-search-result");
    if (!row) return;
    sound.confirm();
    const { kind, id } = row.dataset;
    input.value = "";
    results.hidden = true;
    if (kind === "country") onCountry(id);
    else if (kind === "subregion") onSubregion(id);
    else if (kind === "conflict") onConflict(id);
  });
}

async function collectRelatedNews(store, conflict) {
  const iso3s = conflict.relatedCountries && conflict.relatedCountries.length ? conflict.relatedCountries : conflict.countries;
  const results = [];
  for (const iso3 of iso3s || []) {
    const meta = store.countries[iso3];
    if (!meta || !meta.hasData) continue;
    const doc = await store.getNews(iso3);
    const all = [...(doc.daily || []), ...(doc.weekly || []), ...(doc.developing || [])];
    results.push(...all.filter((i) => i.category === "military").map((i) => ({ ...i, __country: meta.name })));
  }
  return results;
}

async function main() {
  startClock();
  const [store] = await Promise.all([loadStore(), bootSequence()]);

  renderLegend(store);
  updateStatusBar(store);

  const panelRoot = document.getElementById("news-panel");
  const panel = createPanel({
    rootEl: panelRoot,
    emptyEl: document.getElementById("panel-empty"),
    contentEl: document.getElementById("panel-content"),
    store,
  });

  const map = await createMap({
    svgEl: document.getElementById("world-map"),
    store,
    onSelectCountry: (iso3) => panel.renderCountry(iso3),
    onSelectSubregion: (id) => panel.renderSubregion(id),
    onSelectConflict: async (conflictId) => {
      const conflict = store.conflicts.find((c) => c.id === conflictId);
      if (!conflict) return;
      map.focusConflict(conflict.lon, conflict.lat);
      const related = await collectRelatedNews(store, conflict);
      panel.renderConflict(conflict, related);
    },
  });

  panelRoot.addEventListener("ares:close", () => {
    panel.hide();
    map.clearSelection();
  });
  panelRoot.addEventListener("ares:selectSubregion", (e) => panel.renderSubregion(e.detail.id));
  panelRoot.addEventListener("ares:selectCountry", (e) => {
    map.focusCountry(e.detail.iso3);
    panel.renderCountry(e.detail.iso3);
  });

  setupSearch(store, {
    onCountry: (iso3) => {
      map.focusCountry(iso3);
      panel.renderCountry(iso3);
    },
    onSubregion: (id) => panel.renderSubregion(id),
    onConflict: async (conflictId) => {
      const conflict = store.conflicts.find((c) => c.id === conflictId);
      if (!conflict) return;
      map.focusConflict(conflict.lon, conflict.lat);
      const related = await collectRelatedNews(store, conflict);
      panel.renderConflict(conflict, related);
    },
  });

  document.getElementById("zoom-in").addEventListener("click", () => { sound.click(); map.zoomIn(); });
  document.getElementById("zoom-out").addEventListener("click", () => { sound.click(); map.zoomOut(); });
  document.getElementById("zoom-reset").addEventListener("click", () => {
    sound.click();
    map.zoomReset();
    map.clearSelection();
    panel.hide();
  });

  const legendToggle = document.getElementById("legend-toggle");
  legendToggle.addEventListener("click", () => {
    sound.toggle();
    document.getElementById("legend").classList.toggle("collapsed");
    legendToggle.classList.toggle("active");
  });

  const muteBtn = document.getElementById("mute-toggle");
  function syncMuteBtn() {
    const muted = sound.isMuted();
    muteBtn.setAttribute("aria-pressed", String(!muted));
    muteBtn.querySelector("span").textContent = muted ? "♪ MUTED" : "♪ AUDIO";
  }
  syncMuteBtn();
  muteBtn.addEventListener("click", () => {
    sound.toggleMuted();
    syncMuteBtn();
    if (!sound.isMuted()) sound.toggle();
  });
}

main().catch((err) => {
  console.error(err);
  const bootEl = document.getElementById("boot-screen");
  if (bootEl) {
    bootEl.classList.remove("hidden");
    document.getElementById("boot-log").textContent += `\n\nFATAL: ${err.message}\nCheck console for details.`;
  }
});

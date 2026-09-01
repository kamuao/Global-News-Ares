// Renders the slide-in "console" panel: country/subregion SITREP (daily /
// weekly / developing tabs + category filters) or a conflict detail view.

import { sound } from "./sound.js";

const TABS = [
  { id: "daily", label: "DAILY" },
  { id: "weekly", label: "WEEKLY" },
  { id: "developing", label: "DEVELOPING" },
];

function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const h = Math.round(diffMs / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function biasBadge(source) {
  const bias = source.bias || "center";
  const label = bias.replace("-", " ");
  return `<span class="bias-badge bias-${bias}" title="Editorial bias estimate: ${label}"><span class="dot"></span>${label}</span>`;
}

function newsCard(item, store) {
  const source = store.sourceFor(item.source);
  const category = store.categoryFor(item.category);
  const url = item.url || source.homepage || "#";
  const media = item.image
    ? `<img src="${item.image}" alt="" loading="lazy" />`
    : category.icon;

  const developments = item.keyDevelopments
    ? `<ul class="key-developments">${item.keyDevelopments
        .map((k) => `<li><time>${new Date(k.at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time>${escapeHtml(k.note)}</li>`)
        .join("")}</ul>`
    : "";

  return `
    <article class="news-card" data-category="${item.category}">
      <div class="news-card-media">${media}</div>
      <div class="news-card-body">
        <div class="news-card-meta">
          ${biasBadge(source)}
          <span class="category-tag">${category.icon} ${category.label}</span>
          ${item.sample ? '<span class="sample-badge" title="Placeholder sample entry — replaced automatically once the daily RSS fetch runs">SAMPLE</span>' : ""}
        </div>
        <h4 class="news-card-title">${escapeHtml(item.title)}</h4>
        <p class="news-card-summary">${escapeHtml(item.summary)}</p>
        ${developments}
        <div class="news-card-footer">
          <span class="published-at">${source.name} · ${timeAgo(item.publishedAt)}</span>
          <a class="read-btn js-read-link" href="${url}" target="_blank" rel="noopener noreferrer">READ FULL ARTICLE →</a>
        </div>
      </div>
    </article>`;
}

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function createPanel({ rootEl, emptyEl, contentEl, store }) {
  let state = null; // { mode: 'country'|'subregion'|'conflict', id, activeTab, activeCategory }

  function show() {
    emptyEl.hidden = true;
    contentEl.hidden = false;
  }

  function hide() {
    emptyEl.hidden = false;
    contentEl.hidden = true;
    state = null;
  }

  async function renderRegion(id, meta, breadcrumb) {
    state = { mode: "region", id, activeTab: "daily", activeCategory: "all" };
    const doc = await store.getNews(id);

    function render() {
      const items = doc[state.activeTab] || [];
      const filtered = state.activeCategory === "all" ? items : items.filter((i) => i.category === state.activeCategory);
      const categoriesPresent = [...new Set([...(doc.daily || []), ...(doc.weekly || []), ...(doc.developing || [])].map((i) => i.category))];

      contentEl.innerHTML = `
        <div class="panel-header">
          <button class="panel-close" id="panel-close-btn" aria-label="Close">✕</button>
          <div class="panel-breadcrumb">${breadcrumb}</div>
          <div class="panel-title">${meta.flag || "◈"} ${escapeHtml(meta.name)}</div>
          <div class="panel-region">${meta.region || ""}${doc.sample ? " · SAMPLE DATA — see README" : ""}</div>
          ${renderSubregionRow(meta)}
        </div>
        <div class="panel-tabs">
          ${TABS.map(
            (t) =>
              `<button class="panel-tab ${t.id === state.activeTab ? "active" : ""}" data-tab="${t.id}">${t.label} <span class="count">${(doc[t.id] || []).length}</span></button>`
          ).join("")}
        </div>
        <div class="category-filters">
          <button class="category-chip ${state.activeCategory === "all" ? "active" : ""}" data-cat="all">ALL</button>
          ${categoriesPresent
            .map((c) => {
              const cat = store.categoryFor(c);
              return `<button class="category-chip ${state.activeCategory === c ? "active" : ""}" data-cat="${c}">${cat.icon} ${cat.label}</button>`;
            })
            .join("")}
        </div>
        <div class="news-list">
          ${filtered.length ? filtered.map((item) => newsCard(item, store)).join("") : `<div class="empty-state">No ${state.activeTab} stories in this category yet.</div>`}
        </div>
      `;

      contentEl.querySelector("#panel-close-btn").addEventListener("click", () => {
        sound.click();
        rootEl.dispatchEvent(new CustomEvent("ares:close"));
      });

      contentEl.querySelectorAll(".panel-tab").forEach((btn) =>
        btn.addEventListener("click", () => {
          sound.click();
          state.activeTab = btn.dataset.tab;
          render();
        })
      );

      contentEl.querySelectorAll(".category-chip").forEach((btn) =>
        btn.addEventListener("click", () => {
          sound.click();
          state.activeCategory = btn.dataset.cat;
          render();
        })
      );

      contentEl.querySelectorAll(".js-read-link").forEach((link) =>
        link.addEventListener("click", () => sound.confirm())
      );

      contentEl.querySelectorAll(".subregion-chip").forEach((btn) =>
        btn.addEventListener("click", () => {
          sound.confirm();
          rootEl.dispatchEvent(new CustomEvent("ares:selectSubregion", { detail: { id: btn.dataset.subregion } }));
        })
      );
    }

    render();
    show();
  }

  function renderSubregionRow(meta) {
    if (!meta.subregions || !meta.subregions.length) return "";
    return `<div class="subregion-row">
      ${meta.subregions
        .map((id) => {
          const s = store.subregions[id];
          return s ? `<button class="subregion-chip" data-subregion="${id}">${s.flag || "📍"} ${escapeHtml(s.name)}</button>` : "";
        })
        .join("")}
    </div>`;
  }

  async function renderCountry(iso3) {
    const meta = store.countries[iso3];
    if (!meta) return;
    await renderRegion(iso3, meta, `<span>WORLD</span> › <span>${meta.region || ""}</span>`);
  }

  async function renderSubregion(id) {
    const s = store.subregions[id];
    if (!s) return;
    const parent = store.countries[s.parent];
    const breadcrumb = `<button data-back-to="${s.parent}">WORLD › ${parent ? parent.name : s.parent}</button> › <span>${s.name}</span>`;
    await renderRegion(id, { name: s.name, flag: s.flag, region: parent ? parent.name : "" }, breadcrumb);
    contentEl.querySelectorAll("[data-back-to]").forEach((btn) =>
      btn.addEventListener("click", () => {
        sound.click();
        rootEl.dispatchEvent(new CustomEvent("ares:selectCountry", { detail: { iso3: btn.dataset.backTo } }));
      })
    );
  }

  function renderConflict(conflict, relatedNews) {
    state = { mode: "conflict", id: conflict.id };
    const typeLabel = conflict.type.replace("-", " ");

    const history = conflict.history || [];
    const historyHtml = history.length
      ? `<ol class="history-timeline">
          ${history
            .map(
              (h) => `<li class="history-entry"><span class="history-period">${escapeHtml(h.period)}</span><p>${escapeHtml(h.text)}</p></li>`
            )
            .join("")}
        </ol>`
      : "";

    // Conflict-specific curated coverage, then related country Military-category
    // coverage, deduped so the same story never appears twice.
    const seen = new Set();
    const combinedNews = [...(conflict.news || []), ...relatedNews].filter((item) => {
      const key = item.url || item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    contentEl.innerHTML = `
      <div class="panel-header">
        <button class="panel-close" id="panel-close-btn" aria-label="Close">✕</button>
        <div class="panel-breadcrumb"><span>WORLD</span> › <span>MARKERS</span></div>
        <div class="panel-title">${conflict.name}</div>
      </div>
      <div class="conflict-detail type-${conflict.type}">
        <span class="conflict-type-badge">${typeLabel}</span>
        <div class="conflict-meta-row">
          <span>STATUS: ${conflict.status.toUpperCase()}</span>
          <span>SINCE: ${conflict.since}</span>
        </div>
        <p class="conflict-summary">${escapeHtml(conflict.summary)}</p>
        ${history.length ? `<h4 class="section-heading">HISTORY / TIMELINE</h4>${historyHtml}` : ""}
      </div>
      <div class="panel-tabs"><button class="panel-tab active">RELATED COVERAGE <span class="count">${combinedNews.length}</span></button></div>
      <div class="news-list">
        ${combinedNews.length ? combinedNews.map((item) => newsCard(item, store)).join("") : '<div class="empty-state">No related coverage configured for this marker yet.</div>'}
      </div>
    `;

    contentEl.querySelector("#panel-close-btn").addEventListener("click", () => {
      sound.click();
      rootEl.dispatchEvent(new CustomEvent("ares:close"));
    });
    contentEl.querySelectorAll(".js-read-link").forEach((link) => link.addEventListener("click", () => sound.confirm()));

    show();
  }

  return { renderCountry, renderSubregion, renderConflict, hide };
}

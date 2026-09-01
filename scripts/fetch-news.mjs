#!/usr/bin/env node
/**
 * Pulls the RSS feeds configured in scripts/feeds.config.mjs, classifies
 * each item into a category (data/categories.json) and a time bucket
 * (daily / weekly / developing), and rewrites data/news/<id>.json.
 *
 * Run manually with `npm run fetch-news`. In production this is meant to run
 * on a schedule via .github/workflows/update-news.yml (GitHub Actions has
 * unrestricted outbound internet, unlike sandboxed dev/CI containers that
 * block arbitrary hosts).
 *
 * Resilient by design: a feed that fails to fetch/parse is logged and
 * skipped, never crashes the run. A country with zero successful feeds keeps
 * its last known good data/news/<id>.json untouched instead of being wiped.
 */
import Parser from "rss-parser";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { feeds, CATEGORY_KEYWORDS } from "./feeds.config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const NEWS_DIR = join(__dirname, "..", "data", "news");

const DEVELOPING_KEYWORDS = [
  "live updates", "developing", "breaking:", "what we know", "latest:", "live:", "rolling coverage",
];

const DAY_MS = 24 * 3600 * 1000;
const WEEK_MS = 7 * DAY_MS;
const DEVELOPING_TTL_MS = 14 * DAY_MS;

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "AresNewsBot/1.0 (+https://github.com/kamuao/Global-News-Ares)" },
  customFields: {
    item: [
      ["media:thumbnail", "mediaThumbnail"],
      ["media:content", "mediaContent"],
    ],
  },
});

function classifyCategory(configured, text) {
  if (configured) return configured;
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "politics") continue; // politics is the fallback, checked last
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return "politics";
}

function extractImage(item) {
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  if (item.enclosure?.url && /^image\//.test(item.enclosure.type || "")) return item.enclosure.url;
  return null;
}

function slug(url) {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 31 + url.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

async function fetchFeed(feedConfig) {
  try {
    const parsed = await parser.parseURL(feedConfig.url);
    return { ok: true, feedConfig, items: parsed.items || [] };
  } catch (err) {
    return { ok: false, feedConfig, error: err.message };
  }
}

function loadExisting(regionId) {
  const path = join(NEWS_DIR, `${regionId}.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

async function processRegion(regionId, regionFeeds, regionName) {
  if (!regionFeeds || regionFeeds.length === 0) {
    return { regionId, skipped: true, reason: "no feeds configured" };
  }

  const results = await Promise.all(regionFeeds.map(fetchFeed));
  const okResults = results.filter((r) => r.ok);
  const failResults = results.filter((r) => !r.ok);

  if (okResults.length === 0) {
    return { regionId, skipped: true, reason: "all feeds failed", failures: failResults };
  }

  const now = Date.now();
  const allItems = [];

  for (const result of okResults) {
    for (const raw of result.items) {
      const publishedAt = raw.isoDate || raw.pubDate || new Date().toISOString();
      const publishedTime = new Date(publishedAt).getTime();
      if (Number.isNaN(publishedTime)) continue;

      const title = (raw.title || "").trim();
      const summary = (raw.contentSnippet || raw.summary || "").trim().slice(0, 320);
      if (!title || !raw.link) continue;

      allItems.push({
        id: slug(raw.link),
        title,
        summary,
        category: classifyCategory(result.feedConfig.category, `${title} ${summary}`),
        source: result.feedConfig.source,
        url: raw.link,
        image: extractImage(raw),
        publishedAt: new Date(publishedTime).toISOString(),
        sample: false,
        _ageMs: now - publishedTime,
        _isDeveloping: DEVELOPING_KEYWORDS.some((k) => title.toLowerCase().includes(k)),
      });
    }
  }

  // De-dupe by URL, keep newest wins
  const byUrl = new Map();
  for (const item of allItems) byUrl.set(item.url, item);
  const unique = [...byUrl.values()].sort((a, b) => b._ageMs < a._ageMs ? 1 : -1);

  const daily = unique.filter((i) => i._ageMs <= DAY_MS).map(stripInternal);
  const weekly = unique.filter((i) => i._ageMs > DAY_MS && i._ageMs <= WEEK_MS).map(stripInternal);

  const existing = loadExisting(regionId);
  const carriedDeveloping = (existing?.developing || []).filter(
    (d) => !d.sample && now - new Date(d.publishedAt).getTime() <= DEVELOPING_TTL_MS
  );
  const newDeveloping = unique.filter((i) => i._isDeveloping).map(stripInternal);
  const developingByUrl = new Map();
  for (const d of [...carriedDeveloping, ...newDeveloping]) developingByUrl.set(d.url, d);
  const developing = [...developingByUrl.values()].slice(0, 8);

  const doc = {
    id: regionId,
    name: regionName,
    sample: false,
    updatedAt: new Date(now).toISOString(),
    daily,
    weekly,
    developing,
  };

  writeFileSync(join(NEWS_DIR, `${regionId}.json`), JSON.stringify(doc, null, 2) + "\n");

  return {
    regionId,
    skipped: false,
    counts: { daily: daily.length, weekly: weekly.length, developing: developing.length },
    okFeeds: okResults.length,
    failedFeeds: failResults,
  };
}

function stripInternal({ _ageMs, _isDeveloping, ...rest }) {
  return rest;
}

async function main() {
  const countriesPath = join(__dirname, "..", "data", "countries.json");
  const countries = JSON.parse(readFileSync(countriesPath, "utf-8"));
  delete countries._comment;

  const nameByIso3 = {};
  for (const meta of Object.values(countries)) nameByIso3[meta.iso3] = meta.name;
  const subregionsPath = join(__dirname, "..", "data", "subregions.json");
  const subregions = JSON.parse(readFileSync(subregionsPath, "utf-8"));
  delete subregions._comment;
  for (const [id, s] of Object.entries(subregions)) nameByIso3[id] = s.name;

  const summary = [];
  for (const [regionId, regionFeeds] of Object.entries(feeds)) {
    const name = nameByIso3[regionId] || regionId;
    console.log(`\n=== ${regionId} (${name}) ===`);
    const result = await processRegion(regionId, regionFeeds, name);
    summary.push(result);

    if (result.skipped) {
      console.log(`  SKIPPED: ${result.reason}`);
    } else {
      console.log(`  OK: ${result.okFeeds}/${regionFeeds.length} feeds · daily=${result.counts.daily} weekly=${result.counts.weekly} developing=${result.counts.developing}`);
    }
    for (const f of result.failures || result.failedFeeds || []) {
      console.log(`  FAIL [${f.feedConfig.source}] ${f.feedConfig.url} — ${f.error}`);
    }
  }

  const totalOk = summary.filter((s) => !s.skipped).length;
  const totalSkipped = summary.filter((s) => s.skipped).length;
  console.log(`\n=== SUMMARY: ${totalOk} region(s) updated, ${totalSkipped} skipped ===`);
}

main().catch((err) => {
  console.error("Fatal error in fetch-news:", err);
  process.exit(1);
});

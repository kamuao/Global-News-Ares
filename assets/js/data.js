// Loads and normalizes all static JSON data: country/subregion metadata,
// source bias registry, category taxonomy, conflicts, and per-country news.

async function getJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

export async function loadStore() {
  const [countriesRaw, subregionsRaw, sources, categories, conflicts] = await Promise.all([
    getJSON("data/countries.json"),
    getJSON("data/subregions.json"),
    getJSON("data/sources.json"),
    getJSON("data/categories.json"),
    getJSON("data/conflicts.json"),
  ]);

  delete countriesRaw._comment;
  delete subregionsRaw._comment;

  const countriesByIso3 = {};
  const countriesByNumericId = {};
  for (const [numericId, meta] of Object.entries(countriesRaw)) {
    const record = { ...meta, numericId };
    countriesByIso3[meta.iso3] = record;
    countriesByNumericId[numericId] = record;
  }

  const newsCache = new Map();

  async function getNews(regionId) {
    if (newsCache.has(regionId)) return newsCache.get(regionId);
    try {
      const doc = await getJSON(`data/news/${regionId}.json`);
      newsCache.set(regionId, doc);
      return doc;
    } catch (err) {
      const fallback = { id: regionId, name: regionId, sample: true, error: true, daily: [], weekly: [], developing: [] };
      newsCache.set(regionId, fallback);
      return fallback;
    }
  }

  function sourceFor(sourceId) {
    return sources[sourceId] || { name: sourceId, bias: "center", homepage: null };
  }

  function categoryFor(categoryId) {
    return categories[categoryId] || { label: categoryId, icon: "•" };
  }

  return {
    countries: countriesByIso3,
    countriesByNumericId,
    subregions: subregionsRaw,
    sources,
    categories,
    conflicts,
    getNews,
    sourceFor,
    categoryFor,
  };
}

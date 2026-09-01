/**
 * Per-country RSS feed configuration for scripts/fetch-news.mjs.
 *
 * Each entry: { source: <sourceId from data/sources.json>, url: <RSS feed URL>, category: <one of data/categories.json | null> }
 * category: null means "classify automatically" — fetch-news.mjs runs a keyword
 * match against the item's title/summary (see CATEGORY_KEYWORDS below) and
 * falls back to "politics" for general/world feeds.
 *
 * These are public, no-API-key-required RSS feeds. Outlets occasionally move
 * or retire feed URLs — the fetch script logs a per-feed OK/FAIL summary on
 * every run (visible in the GitHub Actions log) rather than failing the whole
 * job, so a dead link just quietly stops updating that one source until you
 * fix the URL here. Add a country by adding a key (its ISO3, matching
 * data/countries.json) with 1+ feeds, then flip that country's "hasData" to
 * true in data/countries.json.
 */

export const feeds = {
  USA: [
    { source: "nyt", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", category: null },
    { source: "nyt", url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", category: "economy" },
    { source: "nyt", url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", category: "technology" },
    { source: "npr", url: "https://feeds.npr.org/1001/rss.xml", category: null },
    { source: "cnn", url: "http://rss.cnn.com/rss/cnn_topstories.rss", category: null },
    { source: "fox-news", url: "https://moxie.foxnews.com/google-publisher/politics.xml", category: "politics" },
    { source: "fox-news", url: "https://moxie.foxnews.com/google-publisher/world.xml", category: null },
  ],

  "USA-CA-SAC": [
    // TODO: The Sacramento Bee's current RSS path could not be confirmed from
    // this environment (no outbound internet access during authoring). Visit
    // sacbee.com and look for an RSS/syndication link, then add it here, e.g.:
    // { source: "sacramento-bee", url: "https://www.sacbee.com/news/local/?widgetName=rssfeed&widgetContentId=...&getXmlFeed=true", category: "society" },
  ],

  GBR: [
    { source: "bbc-news", url: "https://feeds.bbci.co.uk/news/uk/rss.xml", category: null },
    { source: "bbc-news", url: "https://feeds.bbci.co.uk/news/business/rss.xml", category: "economy" },
    { source: "bbc-news", url: "https://feeds.bbci.co.uk/news/technology/rss.xml", category: "technology" },
    { source: "bbc-news", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", category: "environment" },
    { source: "bbc-news", url: "https://feeds.bbci.co.uk/news/health/rss.xml", category: "health" },
    { source: "the-guardian", url: "https://www.theguardian.com/uk-news/rss", category: null },
  ],

  FRA: [
    { source: "france24", url: "https://www.france24.com/en/rss", category: null },
    { source: "le-monde", url: "https://www.lemonde.fr/rss/une.xml", category: null },
  ],

  DEU: [
    { source: "dw", url: "https://rss.dw.com/xml/rss-en-all", category: null },
  ],

  RUS: [
    { source: "tass", url: "https://tass.com/rss/v2.xml", category: null },
    { source: "moscow-times", url: "https://www.themoscowtimes.com/rss/news", category: null },
  ],

  UKR: [
    { source: "kyiv-independent", url: "https://kyivindependent.com/feed/", category: null },
  ],

  CHN: [
    { source: "china-daily", url: "https://www.chinadaily.com.cn/rss/world_rss.xml", category: null },
    { source: "scmp", url: "https://www.scmp.com/rss/91/feed", category: null },
  ],

  JPN: [
    { source: "japan-times", url: "https://www.japantimes.co.jp/feed/", category: null },
  ],

  IND: [
    { source: "times-of-india", url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", category: null },
    { source: "ndtv", url: "https://feeds.feedburner.com/ndtvnews-top-stories", category: null },
  ],

  ISR: [
    { source: "times-of-israel", url: "https://www.timesofisrael.com/feed/", category: null },
  ],

  PSE: [
    { source: "al-jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", category: null },
    { source: "middle-east-eye", url: "https://www.middleeasteye.net/rss", category: null },
  ],

  BRA: [
    { source: "folha", url: "https://www1.folha.uol.com.br/internacional/en/rss091.xml", category: null },
  ],

  ZAF: [
    { source: "mail-guardian", url: "https://mg.co.za/feed/", category: null },
  ],

  AUS: [
    { source: "abc-au", url: "https://www.abc.net.au/news/feed/51120/rss.xml", category: null },
  ],
};

export const CATEGORY_KEYWORDS = {
  military: [
    "military", "war", "troops", "army", "navy", "air force", "missile", "airstrike", "air strike",
    "invasion", "ceasefire", "defense ministry", "defence ministry", "nato", "combat", "soldier",
    "warfare", "weapon", "artillery", "drone strike", "insurgent", "rebel forces", "occupation",
  ],
  health: ["health", "hospital", "disease", "outbreak", "vaccine", "pandemic", "who ", "cdc", "flu", "virus"],
  technology: ["technology", "tech ", "ai ", "artificial intelligence", "software", "cyber", "startup", "chip", "semiconductor", "app "],
  environment: ["climate", "environment", "wildfire", "flood", "drought", "emissions", "renewable", "hurricane", "typhoon", "biodiversity"],
  economy: ["economy", "economic", "market", "stocks", "inflation", "trade", "tariff", "gdp", "central bank", "interest rate", "budget", "unemployment"],
  society: ["community", "local", "school", "housing", "crime", "protest", "culture", "election turnout", "city council"],
  politics: ["election", "president", "parliament", "congress", "prime minister", "government", "policy", "senate", "legislation", "vote", "diplomatic"],
};

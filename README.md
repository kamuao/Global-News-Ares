# ARES — Global News SITREP

An interactive, military-HUD-styled world map for daily global and local news:
click a country (or a war/dispute marker) to open a console-style panel with
**Daily / Weekly / Developing** tabs, news sorted into categories (Military,
Politics, Economy, Society, Technology, Environment, Health), a left/right
**bias badge** on every source, and a **Read Full Article** button that links
straight to the original publisher. Every interaction (clicks, tab changes,
zoom, mute) has a small synthesized HUD sound effect.

No build step, no framework, no backend server required — it's static
HTML/CSS/JS plus a set of JSON data files, so it can be hosted anywhere
(GitHub Pages, Netlify, Vercel, S3, or just opened locally).

## Running it locally

```bash
npm install         # only needed for the fetch-news / smoke-test scripts
npm run serve        # serves the site at http://localhost:8123
```

Then open `http://localhost:8123`. There's no build step for the site
itself — `index.html` loads its JS as ES modules directly.

## ⭐ The most important part: keeping it updated **daily**

I can't run a live server for you — once this session ends, nothing here
executes on its own unless something *else* runs it. So the update mechanism
had to be something that keeps working without me. Here's what's wired up:

**`.github/workflows/update-news.yml`** is a GitHub Actions workflow that
runs on a schedule (every 6 hours, see the `cron` line) **on GitHub's own
servers** — it doesn't depend on this dev session at all. Each run:

1. Checks out the repo.
2. Runs `node scripts/fetch-news.mjs`, which pulls every RSS feed listed in
   `scripts/feeds.config.mjs`, classifies each item into a category and a
   time bucket (daily / weekly / developing), and rewrites
   `data/news/<country>.json`.
3. Commits and pushes the updated JSON straight back to the repo, if
   anything changed.

Because the site reads those JSON files at page-load, **the live site
updates itself** every time that workflow runs — no server, no database, no
API key, no cost (RSS is free and public).

### To turn this on

1. **Merge this branch to your repository's default branch.** Scheduled
   GitHub Actions workflows only fire from the default branch — that's a
   GitHub platform rule, not something this repo controls.
2. Host the site somewhere that serves the repo's files directly, e.g.
   **GitHub Pages** (Settings → Pages → deploy from the default branch) — a
   one-time, free setup. Vercel/Netlify also work (point them at the repo
   root, no build command needed).
3. That's it. Every 6 hours, Actions fetches fresh news and commits it; your
   Pages/Vercel/Netlify deploy picks up the new commit automatically.

You can also trigger it on demand from the **Actions** tab → "Daily news
update" → **Run workflow**, or `npm run fetch-news` locally if your machine
has normal internet access (this authoring environment's sandbox blocks
outbound requests to arbitrary hosts, which is why the seed data below is
clearly marked as samples rather than fetched live).

### If you want more than RSS

RSS is free and requires no signup, which is why the pipeline defaults to
it. If you later want broader coverage or guaranteed uptime, you can swap in
a paid provider (NewsAPI.org, GNews, Google News RSS, a specific outlet's
official API) by editing `scripts/fetch-news.mjs` — store the API key as a
**GitHub Actions secret** (`Settings → Secrets and variables → Actions`) and
reference it via `process.env.YOUR_KEY_NAME` in the workflow's `env:` block.
Never commit an API key to the repo itself.

### Data honesty note

Some feed URLs in `scripts/feeds.config.mjs` are marked `// TODO` where I
wasn't confident enough in a specific outlet's current RSS path to ship it
untested (this dev sandbox has no general internet access, so I couldn't
verify every one live). The fetch script is resilient to bad URLs — it logs
a per-feed OK/FAIL line on every run and simply skips a broken feed rather
than crashing, so check the Actions run log occasionally and patch any dead
links. Until the workflow has run at least once, `data/news/*.json` ships
with **clearly labeled `"sample": true` placeholder entries** (visible in
the UI as a `SAMPLE` badge) describing realistic topic areas rather than
invented headlines — they're replaced automatically by the first real fetch.

## Architecture

```
index.html                   Page shell
assets/css/styles.css        Military HUD theme (dark, scanlines, glow)
assets/js/
  app.js                     Boot sequence, wiring, search, legend, clock
  map.js                     D3 world map: countries, conflict/dispute markers, zoom
  panel.js                   Slide-in news panel: tabs, category filters, cards
  data.js                    Loads/normalizes all JSON data
  sound.js                   Web Audio synthesized click/confirm/deny/alert tones
vendor/
  js/d3.min.js, topojson-client.min.js   Vendored (not CDN) — offline-capable
  geo/countries-110m.json    World topography, Natural Earth via world-atlas
                              (public domain — see vendor/geo/world-atlas-LICENSE.txt)
data/
  countries.json             Numeric TopoJSON id → ISO3/name/flag/hasData/subregions
  subregions.json            Local drill-down areas (e.g. Sacramento, CA) under a country
  sources.json                Outlet registry: name, editorial bias label, homepage
  categories.json            Military/Politics/Economy/Society/Technology/Environment/Health
  conflicts.json             Wars, territorial disputes, occupied territories (lat/lon + summary)
  news/<ISO3>.json           Per-country daily/weekly/developing news
scripts/
  fetch-news.mjs             The daily-update job (see above)
  feeds.config.mjs           Which RSS feed feeds which country/category
  generate-sample-data.mjs   Regenerates placeholder samples for a new country
  smoke-test.mjs             Headless-browser check (map renders, panel opens, etc.)
.github/workflows/update-news.yml   The scheduled job
```

### Why vendored map data instead of a CDN

The world map comes from the [`world-atlas`](https://github.com/topojson/world-atlas)
npm package, which packages Natural Earth data — **explicitly public
domain**. It's copied into `vendor/geo/` rather than fetched from a CDN at
runtime, so the map works fully offline and isn't dependent on a third
party staying up. `d3` and `topojson-client` (MIT-licensed) are vendored the
same way.

### Adding a country or local area

1. Look up its numeric ID in `vendor/geo/countries-110m.json` (search for its
   name in `objects.countries.geometries[].properties.name`).
2. Add an entry to `data/countries.json` keyed by that numeric ID, with
   `hasData: true`.
3. Add a feed list to `scripts/feeds.config.mjs` (or run
   `node scripts/generate-sample-data.mjs` after editing it to seed
   placeholders first).
4. For a **local area** inside a country (a city/region, like the Sacramento
   example), add it to `data/subregions.json` with `lat`/`lon` and list its
   id under that country's `subregions` array in `data/countries.json`.

### Adding/adjusting a conflict, dispute, or occupied territory

Edit `data/conflicts.json`. Each entry needs `type` (`war` |
`territorial-dispute` | `occupied-territory`), `lat`/`lon` for its map
marker, and `relatedCountries` (ISO3 codes) so the panel can pull in that
country's Military-category news when the marker is clicked.

## On the bias badges

Each source in `data/sources.json` carries a `bias` label
(`left` / `lean-left` / `center` / `lean-right` / `right` / `state-run`).
This is an **editorial approximation** for quick transparency — in the
spirit of public media-bias charts like AllSides or Ad Fontes Media — not an
objective measurement, and reasonable people will disagree on exact
placement for any given outlet. `state-run` marks outlets owned/controlled
by a national government (e.g. TASS, Xinhua) so that's visible at a glance
too. Adjust the labels in `data/sources.json` if you disagree with one.

## Testing

```bash
npm run smoke-test
```

Launches the pre-installed headless Chromium against `npm run serve`,
confirms the map renders all countries, a country click opens the panel
with news cards, tab switching works, a conflict marker opens its detail
view, and search works — and fails if any browser console error fires.
(Requires `npm run serve` to be running in another terminal first.)

## Attribution & disclaimers

ARES is an independent aggregator. Every headline links out to the original
publisher (`Read Full Article`) — content isn't rehosted. Map data is public
domain (Natural Earth). Bias ratings and conflict/dispute summaries are
editorial and meant as a starting point for further reading, not a final
word on contested geopolitical questions.

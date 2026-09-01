#!/usr/bin/env node
/**
 * Generates placeholder ("sample": true) data/news/<id>.json files so the site
 * is fully browsable before the first automated RSS fetch has run (see
 * scripts/fetch-news.mjs and .github/workflows/update-news.yml). Sample items
 * never invent specific headlines/facts — they describe recurring topic areas
 * for that country and link to the real outlet's homepage, clearly flagged
 * "sample": true so the UI can badge them. Re-run manually only if you add a
 * new country before its first live fetch.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "data", "news");
mkdirSync(OUT_DIR, { recursive: true });

const now = Date.now();
const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString();

function item(id, title, summary, category, source, hrs, extra = {}) {
  return {
    id,
    title,
    summary,
    category,
    source,
    url: extra.url ?? null, // filled from source homepage at render time if null
    image: null, // sample data ships no photos; live fetch populates real thumbnails from feed metadata
    publishedAt: hoursAgo(hrs),
    sample: true,
    ...extra,
  };
}

function developing(id, title, summary, category, source, hrs, keyDevelopments) {
  return {
    ...item(id, title, summary, category, source, hrs),
    keyDevelopments,
  };
}

const countries = {
  USA: {
    name: "United States",
    daily: [
      item("usa-d1", "Pentagon briefing outlines force posture updates", "Daily defense department briefing covering troop rotations, readiness levels, and allied coordination.", "military", "military-times", 3),
      item("usa-d2", "Congress debates annual defense appropriations", "Lawmakers continue negotiations over the defense budget topline and procurement priorities.", "politics", "ap-news", 5),
      item("usa-d3", "Federal Reserve commentary moves markets", "Analysts parse the latest remarks from Fed officials for signals on interest-rate policy.", "economy", "wsj", 6),
      item("usa-d4", "Wildfire season strains Western state resources", "Fire crews across Western states report on containment efforts amid dry conditions.", "environment", "npr", 8),
    ],
    weekly: [
      item("usa-w1", "Weekly roundup: AI regulation hearings on Capitol Hill", "A look back at the week's congressional hearings on artificial intelligence oversight.", "technology", "nyt", 30),
      item("usa-w2", "State of the union: border and immigration policy debate", "This week's developments in the ongoing national immigration policy debate.", "politics", "fox-news", 40),
      item("usa-w3", "Public health officials review flu-season preparedness", "A weekly digest of CDC guidance and state-level public health readiness.", "health", "npr", 50),
    ],
    developing: [
      developing("usa-dev1", "Defense modernization program under Congressional review", "An ongoing, multi-month review of a major defense modernization and procurement program.", "military", "military-times", 12, [
        { at: hoursAgo(60), note: "Program review announced by the relevant House and Senate committees." },
        { at: hoursAgo(24), note: "Committee hearings held; agency officials testified on cost and schedule." },
        { at: hoursAgo(2), note: "Interim findings expected to shape next budget cycle." },
      ]),
    ],
  },

  "USA-CA-SAC": {
    name: "Sacramento, CA",
    daily: [
      item("sac-d1", "Sacramento City Council reviews housing development plan", "Local council session on proposed housing and zoning changes for the capital region.", "society", "sacramento-bee", 4),
      item("sac-d2", "California legislature session updates from the Capitol", "Coverage of state legislative activity happening in downtown Sacramento.", "politics", "sacramento-bee", 7),
    ],
    weekly: [
      item("sac-w1", "Weekly look: Sacramento River water levels and delta policy", "A regional look at water management issues affecting the Sacramento Valley.", "environment", "sacramento-bee", 36),
    ],
    developing: [
      developing("sac-dev1", "Regional transit expansion project progress", "An ongoing local infrastructure project tracked over multiple weeks.", "society", "sacramento-bee", 20, [
        { at: hoursAgo(72), note: "Project funding milestone reported." },
        { at: hoursAgo(10), note: "Construction phase update issued by regional transit authority." },
      ]),
    ],
  },

  GBR: {
    name: "United Kingdom",
    daily: [
      item("gbr-d1", "Ministry of Defence briefs on NATO exercise participation", "Update on UK forces taking part in coordinated allied military exercises.", "military", "sky-news", 3),
      item("gbr-d2", "Parliament debates energy policy bill", "Commons debate covering the government's energy and household-bills strategy.", "politics", "bbc-news", 5),
      item("gbr-d3", "Bank of England watched for rate signal", "Markets react to the latest commentary from the Bank of England.", "economy", "the-guardian", 7),
    ],
    weekly: [
      item("gbr-w1", "Weekly digest: NHS winter capacity planning", "A roundup of health-service preparedness stories from across the week.", "health", "bbc-news", 32),
      item("gbr-w2", "Tech sector: UK AI safety institute activity", "This week's coverage of the UK's approach to AI safety research and regulation.", "technology", "telegraph", 44),
    ],
    developing: [
      developing("gbr-dev1", "North Sea energy security review", "Ongoing government review of North Sea energy infrastructure and security.", "economy", "the-guardian", 18, [
        { at: hoursAgo(80), note: "Review launched amid energy security concerns." },
        { at: hoursAgo(15), note: "Industry stakeholders submitted comments." },
      ]),
    ],
  },

  FRA: {
    name: "France",
    daily: [
      item("fra-d1", "Armed forces ministry updates on overseas deployments", "Briefing on French military deployments and regional security cooperation.", "military", "france24", 4),
      item("fra-d2", "National Assembly session on budget negotiations", "Coverage of ongoing budget talks in the French parliament.", "politics", "le-monde", 6),
    ],
    weekly: [
      item("fra-w1", "Weekly view: energy transition and nuclear policy", "A week-in-review of France's nuclear and renewable energy policy debates.", "environment", "le-monde", 34),
      item("fra-w2", "Industrial policy: aerospace sector developments", "Roundup of the week's news from France's aerospace and defense industry.", "economy", "le-figaro", 46),
    ],
    developing: [
      developing("fra-dev1", "Sahel security cooperation realignment", "An evolving story on France's shifting military posture in West Africa.", "military", "france24", 22, [
        { at: hoursAgo(90), note: "Regional partners announced revised security arrangements." },
        { at: hoursAgo(20), note: "Ministry statement on force posture adjustments." },
      ]),
    ],
  },

  DEU: {
    name: "Germany",
    daily: [
      item("deu-d1", "Bundeswehr modernization budget briefing", "Update on Germany's defense spending trajectory and equipment programs.", "military", "dw", 3),
      item("deu-d2", "Bundestag debates coalition economic agenda", "Coverage of the governing coalition's economic policy negotiations.", "politics", "der-spiegel", 5),
    ],
    weekly: [
      item("deu-w1", "Weekly industrial output and export figures", "A roundup of the week's German manufacturing and trade data.", "economy", "der-spiegel", 30),
      item("deu-w2", "Climate policy: industrial decarbonization targets", "This week's coverage of Germany's industrial climate policy.", "environment", "dw", 42),
    ],
    developing: [
      developing("deu-dev1", "Defense procurement modernization fund", "Ongoing coverage of the special defense modernization fund's disbursement.", "military", "bild", 16, [
        { at: hoursAgo(100), note: "Fund allocation plan presented to Bundestag committee." },
        { at: hoursAgo(14), note: "Procurement contracts under committee review." },
      ]),
    ],
  },

  RUS: {
    name: "Russia",
    daily: [
      item("rus-d1", "Defense ministry statement on frontline operations", "State media summary of the defense ministry's daily operational statement.", "military", "tass", 2),
      item("rus-d2", "Kremlin readout on foreign policy meetings", "Official readout of diplomatic meetings involving Russian officials.", "politics", "tass", 5),
      item("rus-d3", "Independent outlet: sanctions impact on economy", "Independent Russian-language coverage of sanctions effects on trade and finance.", "economy", "moscow-times", 7),
    ],
    weekly: [
      item("rus-w1", "Weekly digest: state media military coverage", "A roundup of the week's state-media reporting on military operations.", "military", "rt", 30),
    ],
    developing: [
      developing("rus-dev1", "Frontline situation in eastern Ukraine", "Ongoing, contested reporting on frontline positions — coverage differs sharply between state and independent/foreign sources.", "military", "tass", 6, [
        { at: hoursAgo(48), note: "State media reported operational gains." },
        { at: hoursAgo(6), note: "Independent and Ukrainian sources dispute the state account; cross-check multiple sources." },
      ]),
    ],
  },

  UKR: {
    name: "Ukraine",
    daily: [
      item("ukr-d1", "General Staff operational update", "Daily operational summary from Ukraine's armed forces General Staff.", "military", "kyiv-independent", 2),
      item("ukr-d2", "Government briefing on reconstruction funding", "Update on international reconstruction and reform financing.", "politics", "kyiv-post", 5),
      item("ukr-d3", "Energy grid repair efforts after strikes", "Coverage of infrastructure repair work following attacks on energy infrastructure.", "society", "kyiv-independent", 8),
    ],
    weekly: [
      item("ukr-w1", "Weekly review: Western military aid packages", "A roundup of the week's announcements on allied military assistance.", "military", "kyiv-post", 28),
    ],
    developing: [
      developing("ukr-dev1", "Frontline situation in eastern Ukraine", "Ongoing coverage of frontline developments from the Ukrainian side — cross-check against Russian state-media claims for the same story.", "military", "kyiv-independent", 5, [
        { at: hoursAgo(50), note: "Ukrainian General Staff reported defensive operations." },
        { at: hoursAgo(5), note: "Independent verification of territorial claims ongoing." },
      ]),
    ],
  },

  CHN: {
    name: "China",
    daily: [
      item("chn-d1", "Defense ministry press conference summary", "Official summary of the Ministry of National Defense's regular briefing.", "military", "xinhua", 3),
      item("chn-d2", "State council economic policy statement", "Coverage of the latest economic policy guidance from central authorities.", "economy", "china-daily", 5),
      item("chn-d3", "Regional outlet: tech sector regulatory update", "Independent regional coverage of technology-sector regulation.", "technology", "scmp", 7),
    ],
    weekly: [
      item("chn-w1", "Weekly digest: Belt and Road project updates", "A roundup of the week's infrastructure diplomacy announcements.", "politics", "xinhua", 32),
    ],
    developing: [
      developing("chn-dev1", "Taiwan Strait military activity", "Ongoing coverage of naval and air activity in and around the Taiwan Strait.", "military", "scmp", 10, [
        { at: hoursAgo(70), note: "Increased patrol activity reported near the median line." },
        { at: hoursAgo(9), note: "Taiwanese defense ministry issued a response statement." },
      ]),
    ],
  },

  JPN: {
    name: "Japan",
    daily: [
      item("jpn-d1", "Ministry of Defense briefing on regional posture", "Update on Japan's Self-Defense Forces regional deployments and readiness.", "military", "japan-times", 3),
      item("jpn-d2", "Diet session on fiscal policy", "Coverage of budget deliberations in Japan's National Diet.", "politics", "nhk", 6),
    ],
    weekly: [
      item("jpn-w1", "Weekly view: semiconductor industry policy", "A roundup of the week's technology-industry policy coverage.", "technology", "asahi-shimbun", 34),
    ],
    developing: [
      developing("jpn-dev1", "Regional maritime security cooperation", "Ongoing coverage of trilateral and multilateral maritime security coordination.", "military", "japan-times", 14, [
        { at: hoursAgo(90), note: "Joint exercise announced with regional partners." },
        { at: hoursAgo(11), note: "Exercise proceeded; officials issued a joint statement." },
      ]),
    ],
  },

  IND: {
    name: "India",
    daily: [
      item("ind-d1", "Defence ministry update on border infrastructure", "Coverage of military infrastructure development along contested border regions.", "military", "times-of-india", 3),
      item("ind-d2", "Parliament session on economic reforms", "Update on legislative debate over economic policy reforms.", "politics", "the-hindu", 5),
    ],
    weekly: [
      item("ind-w1", "Weekly digest: monsoon and agriculture outlook", "A roundup of the week's agricultural and climate coverage.", "environment", "ndtv", 30),
    ],
    developing: [
      developing("ind-dev1", "Line of Actual Control patrol arrangements", "Ongoing coverage of border-management arrangements along the contested frontier.", "military", "times-of-india", 15, [
        { at: hoursAgo(95), note: "Military-to-military talks reported on patrol coordination." },
        { at: hoursAgo(13), note: "Follow-up round of talks scheduled." },
      ]),
    ],
  },

  ISR: {
    name: "Israel",
    daily: [
      item("isr-d1", "IDF spokesperson daily operational update", "Official military update on operations and regional security posture.", "military", "times-of-israel", 2),
      item("isr-d2", "Knesset debate on coalition policy", "Coverage of parliamentary debate over governing coalition priorities.", "politics", "jerusalem-post", 5),
      item("isr-d3", "Independent outlet: humanitarian access coverage", "Independent Israeli press coverage of humanitarian conditions and access.", "society", "haaretz", 7),
    ],
    weekly: [
      item("isr-w1", "Weekly digest: regional diplomacy tracker", "A roundup of the week's regional diplomatic developments.", "politics", "times-of-israel", 30),
    ],
    developing: [
      developing("isr-dev1", "Gaza ceasefire and hostage-related negotiations", "Ongoing, fast-moving negotiations story — check multiple sources given differing accounts.", "military", "times-of-israel", 4, [
        { at: hoursAgo(48), note: "Mediators reported renewed talks." },
        { at: hoursAgo(4), note: "Parties issued separate, partially conflicting statements on terms." },
      ]),
    ],
  },

  PSE: {
    name: "Palestine (Gaza & West Bank)",
    daily: [
      item("pse-d1", "Gaza humanitarian situation update", "Coverage of humanitarian conditions, aid access, and infrastructure in Gaza.", "society", "al-jazeera", 3),
      item("pse-d2", "West Bank access and movement restrictions", "Update on checkpoint and movement conditions across the West Bank.", "society", "middle-east-eye", 5),
    ],
    weekly: [
      item("pse-w1", "Weekly digest: reconstruction and aid tracker", "A roundup of the week's aid-delivery and reconstruction coverage.", "society", "al-jazeera", 30),
    ],
    developing: [
      developing("pse-dev1", "Gaza ceasefire and hostage-related negotiations", "Ongoing, fast-moving negotiations story — check multiple sources given differing accounts.", "military", "al-jazeera", 4, [
        { at: hoursAgo(48), note: "Mediators reported renewed talks." },
        { at: hoursAgo(4), note: "Palestinian officials issued a statement on humanitarian terms." },
      ]),
    ],
  },

  BRA: {
    name: "Brazil",
    daily: [
      item("bra-d1", "Armed forces update on Amazon border operations", "Coverage of military operations against illegal mining and cross-border crime in the Amazon.", "military", "folha", 4),
      item("bra-d2", "Congress debates fiscal framework", "Update on legislative debate over the government's fiscal policy framework.", "politics", "folha", 6),
    ],
    weekly: [
      item("bra-w1", "Weekly view: Amazon deforestation data", "A roundup of the week's environmental monitoring data and policy response.", "environment", "brazil-reports", 32),
    ],
    developing: [
      developing("bra-dev1", "Amazon environmental enforcement operation", "Ongoing multi-agency operation targeting illegal deforestation and mining.", "environment", "folha", 20, [
        { at: hoursAgo(96), note: "Operation launched with federal police and environmental agency support." },
        { at: hoursAgo(18), note: "Enforcement agencies reported interim results." },
      ]),
    ],
  },

  ZAF: {
    name: "South Africa",
    daily: [
      item("zaf-d1", "Defence force update on regional peacekeeping role", "Coverage of South African National Defence Force participation in regional missions.", "military", "news24", 4),
      item("zaf-d2", "Parliament debates energy grid reform", "Update on legislative response to the country's electricity supply challenges.", "politics", "mail-guardian", 6),
    ],
    weekly: [
      item("zaf-w1", "Weekly digest: load-shedding and grid stability", "A roundup of the week's power-supply reliability coverage.", "economy", "news24", 30),
    ],
    developing: [
      developing("zaf-dev1", "Coalition government policy negotiations", "Ongoing coverage of governing coalition policy coordination.", "politics", "mail-guardian", 18, [
        { at: hoursAgo(88), note: "Coalition partners met to align on legislative priorities." },
        { at: hoursAgo(16), note: "Follow-up statement issued on areas of agreement and disagreement." },
      ]),
    ],
  },

  AUS: {
    name: "Australia",
    daily: [
      item("aus-d1", "Defence department briefing on AUKUS submarine program", "Update on the trilateral AUKUS nuclear-powered submarine partnership.", "military", "abc-au", 3),
      item("aus-d2", "Parliament debates housing affordability package", "Coverage of federal legislative debate on housing policy.", "politics", "smh", 6),
    ],
    weekly: [
      item("aus-w1", "Weekly view: Pacific regional diplomacy", "A roundup of the week's diplomatic engagement across the Pacific Islands region.", "politics", "abc-au", 32),
    ],
    developing: [
      developing("aus-dev1", "AUKUS submarine program milestones", "Ongoing, multi-year program coverage tracked as it reaches key milestones.", "military", "abc-au", 24, [
        { at: hoursAgo(120), note: "Program milestone review conducted with partner nations." },
        { at: hoursAgo(22), note: "Budget and timeline update issued." },
      ]),
    ],
  },
};

let count = 0;
for (const [id, payload] of Object.entries(countries)) {
  const doc = {
    id,
    name: payload.name,
    sample: true,
    updatedAt: new Date(now).toISOString(),
    daily: payload.daily,
    weekly: payload.weekly,
    developing: payload.developing,
  };
  writeFileSync(join(OUT_DIR, `${id}.json`), JSON.stringify(doc, null, 2) + "\n");
  count++;
}

console.log(`Wrote ${count} sample news files to ${OUT_DIR}`);

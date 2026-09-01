#!/usr/bin/env node
/**
 * Generates placeholder ("sample": true) data/news/<id>.json files so the site
 * is fully browsable before the first automated RSS fetch has run (see
 * scripts/fetch-news.mjs and .github/workflows/update-news.yml). Sample items
 * never invent specific headlines/facts — they describe recurring topic areas
 * for that country and link to the real outlet's homepage, clearly flagged
 * "sample": true so the UI can badge them. Re-run after editing this file to
 * regenerate data/news/*.json (safe — it fully overwrites those files).
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

// Shorthand: [id, title, summary, category, source, hoursAgo]
function build(prefix, rows) {
  return rows.map((r) => item(`${prefix}-${r[0]}`, r[1], r[2], r[3], r[4], r[5]));
}
function buildDev(prefix, rows) {
  // rows: [id, title, summary, category, source, hoursAgo, [[hrsAgo, note], ...]]
  return rows.map((r) =>
    developing(
      `${prefix}-${r[0]}`,
      r[1],
      r[2],
      r[3],
      r[4],
      r[5],
      r[6].map(([h, note]) => ({ at: hoursAgo(h), note }))
    )
  );
}

const countries = {
  USA: {
    name: "United States",
    daily: build("usa-d", [
      ["1", "Pentagon briefing outlines force posture updates", "Daily defense department briefing covering troop rotations, readiness levels, and allied coordination.", "military", "military-times", 3],
      ["2", "Congress debates annual defense appropriations", "Lawmakers continue negotiations over the defense budget topline and procurement priorities.", "politics", "ap-news", 5],
      ["3", "Federal Reserve commentary moves markets", "Analysts parse the latest remarks from Fed officials for signals on interest-rate policy.", "economy", "wsj", 6],
      ["4", "Wildfire season strains Western state resources", "Fire crews across Western states report on containment efforts amid dry conditions.", "environment", "npr", 8],
      ["5", "Chipmakers navigate export-control rules", "Coverage of how semiconductor firms are adapting supply chains to new trade restrictions.", "technology", "bloomberg", 9],
      ["6", "Hospital systems brace for respiratory illness season", "Public-health officials issue seasonal preparedness guidance for hospital networks.", "health", "npr", 11],
      ["7", "Local zoning fight over data center expansion", "A community debate over a proposed data center's water and power demands.", "society", "nyt", 13],
      ["8", "Naval shipbuilding schedule slips again", "Analysis of delays in the Navy's shipbuilding program and their strategic implications.", "military", "defense-news", 15],
    ]),
    weekly: build("usa-w", [
      ["1", "Weekly roundup: AI regulation hearings on Capitol Hill", "A look back at the week's congressional hearings on artificial intelligence oversight.", "technology", "nyt", 30],
      ["2", "State of the union: border and immigration policy debate", "This week's developments in the ongoing national immigration policy debate.", "politics", "fox-news", 40],
      ["3", "Public health officials review flu-season preparedness", "A weekly digest of CDC guidance and state-level public health readiness.", "health", "npr", 50],
      ["4", "Weekly markets wrap: rate-cut expectations shift", "A roundup of the week's market moves tied to shifting Federal Reserve expectations.", "economy", "bloomberg", 60],
      ["5", "Defense industrial base: shipyard and munitions investment", "A weekly look at investment in the US defense industrial base.", "military", "defense-news", 70],
    ]),
    developing: buildDev("usa-dev", [
      [
        "1",
        "Defense modernization program under Congressional review",
        "An ongoing, multi-month review of a major defense modernization and procurement program.",
        "military",
        "military-times",
        12,
        [
          [60, "Program review announced by the relevant House and Senate committees."],
          [24, "Committee hearings held; agency officials testified on cost and schedule."],
          [2, "Interim findings expected to shape next budget cycle."],
        ],
      ],
      [
        "2",
        "Federal budget negotiations and shutdown risk",
        "Ongoing negotiations over federal appropriations with a recurring risk of a funding lapse.",
        "politics",
        "ap-news",
        18,
        [
          [96, "Leadership opened negotiations on a stopgap measure."],
          [30, "A short-term extension was floated to avoid a lapse."],
          [4, "Talks continue; both chambers remain in session."],
        ],
      ],
      [
        "3",
        "Major tech antitrust case moves through appeals",
        "A closely watched antitrust case against a large technology company continues through the courts.",
        "technology",
        "wsj",
        26,
        [
          [200, "Initial ruling issued at the district court level."],
          [70, "Appeal filed by the losing party."],
          [10, "Appellate briefing schedule set."],
        ],
      ],
    ]),
  },

  "USA-CA-SAC": {
    name: "Sacramento, CA",
    daily: build("sac-d", [
      ["1", "Sacramento City Council reviews housing development plan", "Local council session on proposed housing and zoning changes for the capital region.", "society", "sacramento-bee", 4],
      ["2", "California legislature session updates from the Capitol", "Coverage of state legislative activity happening in downtown Sacramento.", "politics", "sacramento-bee", 7],
      ["3", "Sacramento-area schools address staffing shortages", "Local coverage of teacher and staff hiring challenges in the region's school districts.", "society", "sacramento-bee", 10],
      ["4", "Central Valley agriculture watches water allocations", "Local economic coverage of how state water policy affects Central Valley farms.", "economy", "sacramento-bee", 14],
    ]),
    weekly: build("sac-w", [
      ["1", "Weekly look: Sacramento River water levels and delta policy", "A regional look at water management issues affecting the Sacramento Valley.", "environment", "sacramento-bee", 36],
      ["2", "Sacramento housing market weekly snapshot", "A roundup of local home-price and rental trend coverage.", "economy", "sacramento-bee", 48],
    ]),
    developing: buildDev("sac-dev", [
      [
        "1",
        "Regional transit expansion project progress",
        "An ongoing local infrastructure project tracked over multiple weeks.",
        "society",
        "sacramento-bee",
        20,
        [
          [72, "Project funding milestone reported."],
          [10, "Construction phase update issued by regional transit authority."],
        ],
      ],
    ]),
  },

  GBR: {
    name: "United Kingdom",
    daily: build("gbr-d", [
      ["1", "Ministry of Defence briefs on NATO exercise participation", "Update on UK forces taking part in coordinated allied military exercises.", "military", "sky-news", 3],
      ["2", "Parliament debates energy policy bill", "Commons debate covering the government's energy and household-bills strategy.", "politics", "bbc-news", 5],
      ["3", "Bank of England watched for rate signal", "Markets react to the latest commentary from the Bank of England.", "economy", "the-guardian", 7],
      ["4", "Royal Navy carrier group departs for deployment", "Coverage of a Royal Navy carrier strike group's scheduled deployment.", "military", "telegraph", 9],
      ["5", "NHS trusts report on emergency-department wait times", "Local health-system coverage of emergency care capacity.", "health", "bbc-news", 12],
      ["6", "UK fintech sector eyes new regulatory sandbox", "Coverage of regulatory changes aimed at the financial-technology sector.", "technology", "the-economist", 14],
    ]),
    weekly: build("gbr-w", [
      ["1", "Weekly digest: NHS winter capacity planning", "A roundup of health-service preparedness stories from across the week.", "health", "bbc-news", 32],
      ["2", "Tech sector: UK AI safety institute activity", "This week's coverage of the UK's approach to AI safety research and regulation.", "technology", "telegraph", 44],
      ["3", "Defence spending review: NATO burden-sharing debate", "A week-in-review of UK defense-spending commitments relative to NATO targets.", "military", "reuters", 56],
    ]),
    developing: buildDev("gbr-dev", [
      [
        "1",
        "North Sea energy security review",
        "Ongoing government review of North Sea energy infrastructure and security.",
        "economy",
        "the-guardian",
        18,
        [
          [80, "Review launched amid energy security concerns."],
          [15, "Industry stakeholders submitted comments."],
        ],
      ],
      [
        "2",
        "Royal Navy submarine program cost overruns",
        "An ongoing story tracking cost and schedule issues in a submarine procurement program.",
        "military",
        "defense-news",
        22,
        [
          [150, "Auditors flagged early cost overruns."],
          [40, "Ministry responded with a revised timeline."],
        ],
      ],
    ]),
  },

  FRA: {
    name: "France",
    daily: build("fra-d", [
      ["1", "Armed forces ministry updates on overseas deployments", "Briefing on French military deployments and regional security cooperation.", "military", "france24", 4],
      ["2", "National Assembly session on budget negotiations", "Coverage of ongoing budget talks in the French parliament.", "politics", "le-monde", 6],
      ["3", "France's nuclear deterrent modernization plan", "Coverage of long-term investment plans for France's nuclear forces.", "military", "le-figaro", 9],
      ["4", "Paris tech scene: AI startup funding roundup", "Coverage of venture funding activity in France's technology sector.", "technology", "le-monde", 11],
      ["5", "Farmers' protests over agricultural policy continue", "Local coverage of ongoing agricultural-policy demonstrations.", "society", "france24", 13],
    ]),
    weekly: build("fra-w", [
      ["1", "Weekly view: energy transition and nuclear policy", "A week-in-review of France's nuclear and renewable energy policy debates.", "environment", "le-monde", 34],
      ["2", "Industrial policy: aerospace sector developments", "Roundup of the week's news from France's aerospace and defense industry.", "economy", "le-figaro", 46],
      ["3", "Weekly defense digest: European strategic autonomy debate", "A roundup of coverage on France's push for European defense autonomy.", "military", "france24", 58],
    ]),
    developing: buildDev("fra-dev", [
      [
        "1",
        "Sahel security cooperation realignment",
        "An evolving story on France's shifting military posture in West Africa.",
        "military",
        "france24",
        22,
        [
          [90, "Regional partners announced revised security arrangements."],
          [20, "Ministry statement on force posture adjustments."],
        ],
      ],
    ]),
  },

  DEU: {
    name: "Germany",
    daily: build("deu-d", [
      ["1", "Bundeswehr modernization budget briefing", "Update on Germany's defense spending trajectory and equipment programs.", "military", "dw", 3],
      ["2", "Bundestag debates coalition economic agenda", "Coverage of the governing coalition's economic policy negotiations.", "politics", "der-spiegel", 5],
      ["3", "Germany's arms exports policy under scrutiny", "Coverage of debate over German arms-export approvals to conflict zones.", "military", "der-spiegel", 8],
      ["4", "Auto industry weighs EV transition costs", "Coverage of Germany's automotive sector adapting to electrification mandates.", "economy", "bild", 10],
      ["5", "Berlin startup hub attracts new investment", "Local coverage of Germany's technology and startup ecosystem.", "technology", "dw", 13],
    ]),
    weekly: build("deu-w", [
      ["1", "Weekly industrial output and export figures", "A roundup of the week's German manufacturing and trade data.", "economy", "der-spiegel", 30],
      ["2", "Climate policy: industrial decarbonization targets", "This week's coverage of Germany's industrial climate policy.", "environment", "dw", 42],
      ["3", "Weekly defense digest: special fund disbursement pace", "A roundup of coverage tracking Germany's defense modernization fund.", "military", "reuters", 54],
    ]),
    developing: buildDev("deu-dev", [
      [
        "1",
        "Defense procurement modernization fund",
        "Ongoing coverage of the special defense modernization fund's disbursement.",
        "military",
        "bild",
        16,
        [
          [100, "Fund allocation plan presented to Bundestag committee."],
          [14, "Procurement contracts under committee review."],
        ],
      ],
    ]),
  },

  RUS: {
    name: "Russia",
    daily: build("rus-d", [
      ["1", "Defense ministry statement on frontline operations", "State media summary of the defense ministry's daily operational statement.", "military", "tass", 2],
      ["2", "Kremlin readout on foreign policy meetings", "Official readout of diplomatic meetings involving Russian officials.", "politics", "tass", 5],
      ["3", "Independent outlet: sanctions impact on economy", "Independent Russian-language coverage of sanctions effects on trade and finance.", "economy", "moscow-times", 7],
      ["4", "State media: defense industry production figures", "State-media coverage of military production output figures.", "military", "rt", 9],
      ["5", "Independent coverage: internal migration and conscription", "Independent reporting on the domestic effects of mobilization policy.", "society", "moscow-times", 12],
    ]),
    weekly: build("rus-w", [
      ["1", "Weekly digest: state media military coverage", "A roundup of the week's state-media reporting on military operations.", "military", "rt", 30],
      ["2", "Weekly digest: central bank policy amid sanctions", "A roundup of the week's economic policy coverage under continued sanctions.", "economy", "moscow-times", 44],
    ]),
    developing: buildDev("rus-dev", [
      [
        "1",
        "Frontline situation in eastern Ukraine",
        "Ongoing, contested reporting on frontline positions — coverage differs sharply between state and independent/foreign sources.",
        "military",
        "tass",
        6,
        [
          [48, "State media reported operational gains."],
          [6, "Independent and Ukrainian sources dispute the state account; cross-check multiple sources."],
        ],
      ],
    ]),
  },

  UKR: {
    name: "Ukraine",
    daily: build("ukr-d", [
      ["1", "General Staff operational update", "Daily operational summary from Ukraine's armed forces General Staff.", "military", "kyiv-independent", 2],
      ["2", "Government briefing on reconstruction funding", "Update on international reconstruction and reform financing.", "politics", "kyiv-post", 5],
      ["3", "Energy grid repair efforts after strikes", "Coverage of infrastructure repair work following attacks on energy infrastructure.", "society", "kyiv-independent", 8],
      ["4", "Air defense interception summary", "Daily summary of air-defense activity against incoming strikes.", "military", "unian", 3],
      ["5", "Wartime economy: agricultural export corridor update", "Coverage of grain and agricultural export logistics through Black Sea routes.", "economy", "kyiv-post", 11],
    ]),
    weekly: build("ukr-w", [
      ["1", "Weekly review: Western military aid packages", "A roundup of the week's announcements on allied military assistance.", "military", "kyiv-post", 28],
      ["2", "Weekly digest: humanitarian and displacement tracker", "A roundup of the week's humanitarian-response coverage.", "society", "unian", 40],
    ]),
    developing: buildDev("ukr-dev", [
      [
        "1",
        "Frontline situation in eastern Ukraine",
        "Ongoing coverage of frontline developments from the Ukrainian side — cross-check against Russian state-media claims for the same story.",
        "military",
        "kyiv-independent",
        5,
        [
          [50, "Ukrainian General Staff reported defensive operations."],
          [5, "Independent verification of territorial claims ongoing."],
        ],
      ],
    ]),
  },

  CHN: {
    name: "China",
    daily: build("chn-d", [
      ["1", "Defense ministry press conference summary", "Official summary of the Ministry of National Defense's regular briefing.", "military", "xinhua", 3],
      ["2", "State council economic policy statement", "Coverage of the latest economic policy guidance from central authorities.", "economy", "china-daily", 5],
      ["3", "Regional outlet: tech sector regulatory update", "Independent regional coverage of technology-sector regulation.", "technology", "scmp", 7],
      ["4", "PLA Navy activity near contested waters", "Coverage of naval deployments and patrols in disputed maritime areas.", "military", "scmp", 9],
      ["5", "Property sector stabilization measures", "Coverage of policy measures aimed at stabilizing the real-estate sector.", "economy", "bloomberg", 12],
    ]),
    weekly: build("chn-w", [
      ["1", "Weekly digest: Belt and Road project updates", "A roundup of the week's infrastructure diplomacy announcements.", "politics", "xinhua", 32],
      ["2", "Weekly digest: semiconductor self-sufficiency push", "A roundup of coverage on China's domestic chip-industry investment.", "technology", "scmp", 46],
    ]),
    developing: buildDev("chn-dev", [
      [
        "1",
        "Taiwan Strait military activity",
        "Ongoing coverage of naval and air activity in and around the Taiwan Strait.",
        "military",
        "scmp",
        10,
        [
          [70, "Increased patrol activity reported near the median line."],
          [9, "Taiwanese defense ministry issued a response statement."],
        ],
      ],
    ]),
  },

  JPN: {
    name: "Japan",
    daily: build("jpn-d", [
      ["1", "Ministry of Defense briefing on regional posture", "Update on Japan's Self-Defense Forces regional deployments and readiness.", "military", "japan-times", 3],
      ["2", "Diet session on fiscal policy", "Coverage of budget deliberations in Japan's National Diet.", "politics", "nhk", 6],
      ["3", "Defense budget to fund counterstrike capability", "Coverage of Japan's defense-spending plans for new strike capabilities.", "military", "asahi-shimbun", 9],
      ["4", "Bank of Japan policy watched for yen impact", "Markets coverage of Bank of Japan monetary-policy decisions.", "economy", "nhk", 11],
    ]),
    weekly: build("jpn-w", [
      ["1", "Weekly view: semiconductor industry policy", "A roundup of the week's technology-industry policy coverage.", "technology", "asahi-shimbun", 34],
      ["2", "Weekly digest: regional defense cooperation", "A roundup of coverage on trilateral defense coordination in the region.", "military", "japan-times", 48],
    ]),
    developing: buildDev("jpn-dev", [
      [
        "1",
        "Regional maritime security cooperation",
        "Ongoing coverage of trilateral and multilateral maritime security coordination.",
        "military",
        "japan-times",
        14,
        [
          [90, "Joint exercise announced with regional partners."],
          [11, "Exercise proceeded; officials issued a joint statement."],
        ],
      ],
    ]),
  },

  IND: {
    name: "India",
    daily: build("ind-d", [
      ["1", "Defence ministry update on border infrastructure", "Coverage of military infrastructure development along contested border regions.", "military", "times-of-india", 3],
      ["2", "Parliament session on economic reforms", "Update on legislative debate over economic policy reforms.", "politics", "the-hindu", 5],
      ["3", "Indigenous fighter jet program milestone", "Coverage of progress in India's domestic fighter-aircraft development program.", "military", "times-of-india", 8],
      ["4", "Monsoon impact on agricultural output", "Coverage of seasonal rainfall's effect on crop yields and rural economy.", "environment", "ndtv", 10],
      ["5", "IT sector hiring trends", "Coverage of hiring and outsourcing trends in India's technology sector.", "technology", "the-hindu", 13],
    ]),
    weekly: build("ind-w", [
      ["1", "Weekly digest: monsoon and agriculture outlook", "A roundup of the week's agricultural and climate coverage.", "environment", "ndtv", 30],
      ["2", "Weekly digest: defense indigenization push", "A roundup of coverage on India's push for domestic defense manufacturing.", "military", "times-of-india", 44],
    ]),
    developing: buildDev("ind-dev", [
      [
        "1",
        "Line of Actual Control patrol arrangements",
        "Ongoing coverage of border-management arrangements along the contested frontier.",
        "military",
        "times-of-india",
        15,
        [
          [95, "Military-to-military talks reported on patrol coordination."],
          [13, "Follow-up round of talks scheduled."],
        ],
      ],
    ]),
  },

  ISR: {
    name: "Israel",
    daily: build("isr-d", [
      ["1", "IDF spokesperson daily operational update", "Official military update on operations and regional security posture.", "military", "times-of-israel", 2],
      ["2", "Knesset debate on coalition policy", "Coverage of parliamentary debate over governing coalition priorities.", "politics", "jerusalem-post", 5],
      ["3", "Independent outlet: humanitarian access coverage", "Independent Israeli press coverage of humanitarian conditions and access.", "society", "haaretz", 7],
      ["4", "Iron Dome and air-defense system upgrades", "Coverage of upgrades to Israel's layered air-defense systems.", "military", "jerusalem-post", 9],
      ["5", "Tech sector: cybersecurity startup funding", "Coverage of investment activity in Israel's cybersecurity industry.", "technology", "times-of-israel", 12],
    ]),
    weekly: build("isr-w", [
      ["1", "Weekly digest: regional diplomacy tracker", "A roundup of the week's regional diplomatic developments.", "politics", "times-of-israel", 30],
      ["2", "Weekly digest: northern border security posture", "A roundup of coverage on security dynamics along the northern border.", "military", "jerusalem-post", 42],
    ]),
    developing: buildDev("isr-dev", [
      [
        "1",
        "Gaza ceasefire and hostage-related negotiations",
        "Ongoing, fast-moving negotiations story — check multiple sources given differing accounts.",
        "military",
        "times-of-israel",
        4,
        [
          [48, "Mediators reported renewed talks."],
          [4, "Parties issued separate, partially conflicting statements on terms."],
        ],
      ],
    ]),
  },

  PSE: {
    name: "Palestine (Gaza & West Bank)",
    daily: build("pse-d", [
      ["1", "Gaza humanitarian situation update", "Coverage of humanitarian conditions, aid access, and infrastructure in Gaza.", "society", "al-jazeera", 3],
      ["2", "West Bank access and movement restrictions", "Update on checkpoint and movement conditions across the West Bank.", "society", "middle-east-eye", 5],
      ["3", "Reconstruction planning for Gaza infrastructure", "Coverage of international planning efforts for rebuilding damaged infrastructure.", "society", "al-jazeera", 8],
      ["4", "Official Palestinian Authority statement on talks", "Statement from Palestinian officials on ongoing regional negotiations.", "politics", "wafa", 6],
    ]),
    weekly: build("pse-w", [
      ["1", "Weekly digest: reconstruction and aid tracker", "A roundup of the week's aid-delivery and reconstruction coverage.", "society", "al-jazeera", 30],
      ["2", "Weekly digest: West Bank settlement expansion tracker", "A roundup of coverage on settlement activity and land-status disputes.", "politics", "middle-east-eye", 44],
    ]),
    developing: buildDev("pse-dev", [
      [
        "1",
        "Gaza ceasefire and hostage-related negotiations",
        "Ongoing, fast-moving negotiations story — check multiple sources given differing accounts.",
        "military",
        "al-jazeera",
        4,
        [
          [48, "Mediators reported renewed talks."],
          [4, "Palestinian officials issued a statement on humanitarian terms."],
        ],
      ],
    ]),
  },

  BRA: {
    name: "Brazil",
    daily: build("bra-d", [
      ["1", "Armed forces update on Amazon border operations", "Coverage of military operations against illegal mining and cross-border crime in the Amazon.", "military", "folha", 4],
      ["2", "Congress debates fiscal framework", "Update on legislative debate over the government's fiscal policy framework.", "politics", "folha", 6],
      ["3", "Rio port security operation update", "Coverage of a security operation targeting organized crime affecting port logistics.", "military", "brazil-reports", 9],
      ["4", "Agribusiness export outlook", "Coverage of Brazil's agricultural export sector performance.", "economy", "brazil-reports", 11],
    ]),
    weekly: build("bra-w", [
      ["1", "Weekly view: Amazon deforestation data", "A roundup of the week's environmental monitoring data and policy response.", "environment", "brazil-reports", 32],
      ["2", "Weekly digest: central bank interest rate outlook", "A roundup of the week's monetary-policy coverage.", "economy", "folha", 46],
    ]),
    developing: buildDev("bra-dev", [
      [
        "1",
        "Amazon environmental enforcement operation",
        "Ongoing multi-agency operation targeting illegal deforestation and mining.",
        "environment",
        "folha",
        20,
        [
          [96, "Operation launched with federal police and environmental agency support."],
          [18, "Enforcement agencies reported interim results."],
        ],
      ],
    ]),
  },

  ZAF: {
    name: "South Africa",
    daily: build("zaf-d", [
      ["1", "Defence force update on regional peacekeeping role", "Coverage of South African National Defence Force participation in regional missions.", "military", "news24", 4],
      ["2", "Parliament debates energy grid reform", "Update on legislative response to the country's electricity supply challenges.", "politics", "mail-guardian", 6],
      ["3", "Load-shedding schedule and grid investment", "Coverage of ongoing power-supply reliability measures.", "economy", "news24", 9],
      ["4", "Mining sector labor negotiations", "Coverage of labor negotiations affecting the mining industry.", "economy", "mail-guardian", 12],
    ]),
    weekly: build("zaf-w", [
      ["1", "Weekly digest: load-shedding and grid stability", "A roundup of the week's power-supply reliability coverage.", "economy", "news24", 30],
      ["2", "Weekly digest: regional peacekeeping deployment", "A roundup of coverage on regional security-mission participation.", "military", "mail-guardian", 44],
    ]),
    developing: buildDev("zaf-dev", [
      [
        "1",
        "Coalition government policy negotiations",
        "Ongoing coverage of governing coalition policy coordination.",
        "politics",
        "mail-guardian",
        18,
        [
          [88, "Coalition partners met to align on legislative priorities."],
          [16, "Follow-up statement issued on areas of agreement and disagreement."],
        ],
      ],
    ]),
  },

  AUS: {
    name: "Australia",
    daily: build("aus-d", [
      ["1", "Defence department briefing on AUKUS submarine program", "Update on the trilateral AUKUS nuclear-powered submarine partnership.", "military", "abc-au", 3],
      ["2", "Parliament debates housing affordability package", "Coverage of federal legislative debate on housing policy.", "politics", "smh", 6],
      ["3", "Royal Australian Navy fleet readiness review", "Coverage of a fleet-wide readiness and maintenance review.", "military", "abc-au", 9],
      ["4", "Reserve Bank policy watched for rate signal", "Markets coverage of Reserve Bank of Australia policy commentary.", "economy", "smh", 11],
    ]),
    weekly: build("aus-w", [
      ["1", "Weekly view: Pacific regional diplomacy", "A roundup of the week's diplomatic engagement across the Pacific Islands region.", "politics", "abc-au", 32],
      ["2", "Weekly digest: AUKUS submarine program tracker", "A roundup of the week's coverage on the trilateral submarine partnership.", "military", "smh", 46],
    ]),
    developing: buildDev("aus-dev", [
      [
        "1",
        "AUKUS submarine program milestones",
        "Ongoing, multi-year program coverage tracked as it reaches key milestones.",
        "military",
        "abc-au",
        24,
        [
          [120, "Program milestone review conducted with partner nations."],
          [22, "Budget and timeline update issued."],
        ],
      ],
    ]),
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

#!/usr/bin/env node
/**
 * Merges a "history" timeline and a small "news" sample array into each
 * entry of data/conflicts.json, keyed by conflict id. Existing top-level
 * fields (name, countries, lat, lon, status, since, summary, relatedCountries)
 * are preserved untouched. Re-run after editing CONTENT below to regenerate.
 *
 * History entries describe durable, well-established background — origins,
 * major turning points, current state — not day-to-day developments (those
 * belong in each country's data/news/<ISO3>.json "developing" tab, or will
 * arrive via the live RSS pipeline). News entries are clearly flagged
 * "sample": true, same as data/news/*.json, and link to the real outlet's
 * homepage rather than an invented article URL.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATH = join(__dirname, "..", "data", "conflicts.json");

const now = Date.now();
const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString();

function news(id, title, summary, category, source, hrs) {
  return { id, title, summary, category, source, url: null, image: null, publishedAt: hoursAgo(hrs), sample: true };
}

const CONTENT = {
  "russo-ukrainian-war": {
    history: [
      ["2014", "Russia annexes Crimea after a disputed referendum following the ouster of Ukraine's president; pro-Russian separatists, backed by Russia, seize territory in Donetsk and Luhansk, starting the Donbas war."],
      ["2014–2015", "The Minsk agreements attempt to establish a ceasefire in the Donbas; low-intensity fighting continues for eight years without a political settlement."],
      ["Feb 2022", "Russia launches a full-scale invasion on multiple fronts, aiming to take Kyiv; the offensive is repelled and Russian forces withdraw from northern Ukraine within weeks."],
      ["2022–2023", "Ukraine retakes territory around Kharkiv and Kherson in counteroffensives; Russia declares the annexation of four partially occupied regions, a move not internationally recognized."],
      ["2023–present", "The war settles into attritional fighting along a largely static front line, with long-range strikes on energy and military infrastructure on both sides and periodic diplomatic efforts toward a ceasefire."],
    ],
    news: [
      news("ruw-1", "Frontline positions shift in contested eastern sector", "Competing claims from Ukrainian and Russian sources about control of contested villages along the eastern front.", "military", "kyiv-independent", 6),
      news("ruw-2", "Kremlin statement on peace-talk conditions", "State media summary of the Kremlin's stated conditions for negotiations.", "politics", "tass", 10),
      news("ruw-3", "Sanctions regime adjustments discussed by Western allies", "Coverage of ongoing coordination among Western governments on sanctions enforcement.", "economy", "reuters", 20),
    ],
  },
  "israel-gaza-war": {
    history: [
      ["1948–2007", "The Israeli-Palestinian conflict's roots trace to Israel's 1948 founding and the displacement of Palestinians; Hamas wins Gaza's 2006 elections and takes full control after 2007 fighting with rival Fatah forces."],
      ["2007–2023", "Israel and Egypt maintain a blockade of Gaza; four prior rounds of major fighting occur (2008–09, 2012, 2014, 2021) without a lasting settlement."],
      ["Oct 7, 2023", "Hamas-led fighters launch a large-scale attack on southern Israel, killing roughly 1,200 people and taking hostages; Israel declares war and begins a sustained military campaign in Gaza."],
      ["2023–2024", "Israeli ground and air operations cause widespread destruction and mass displacement in Gaza; several temporary ceasefires bring hostage-for-prisoner exchanges."],
      ["2024–present", "Ceasefire negotiations mediated by Qatar, Egypt, and the US continue alongside intermittent fighting; humanitarian access and reconstruction remain central international concerns."],
    ],
    news: [
      news("igw-1", "Mediators report progress in indirect ceasefire talks", "Qatari and Egyptian mediators describe incremental progress in indirect negotiations.", "military", "al-jazeera", 5),
      news("igw-2", "IDF statement on military operations", "Official Israeli military statement on the current phase of operations.", "military", "times-of-israel", 8),
      news("igw-3", "Humanitarian agencies report on aid corridor access", "International aid organizations detail conditions for aid delivery into Gaza.", "society", "reuters", 14),
    ],
  },
  "sudan-civil-war": {
    history: [
      ["2019", "Long-time ruler Omar al-Bashir is ousted in a popular uprising; a fragile transitional power-sharing arrangement between civilians and the military follows."],
      ["2021", "A military coup involving both the regular armed forces (SAF) and the paramilitary Rapid Support Forces (RSF) derails the transition to civilian rule."],
      ["Apr 2023", "Long-simmering rivalry between SAF leader Gen. Abdel Fattah al-Burhan and RSF leader Gen. Mohamed Hamdan Dagalo erupts into open warfare in Khartoum."],
      ["2023–present", "Fighting spreads nationwide, especially in Darfur; the UN describes the resulting displacement and hunger crisis as among the world's largest."],
    ],
    news: [
      news("scw-1", "Aid agencies warn of worsening famine conditions", "International humanitarian organizations report on deteriorating food security in conflict-affected regions.", "society", "reuters", 9),
      news("scw-2", "Fighting reported around key regional city", "Coverage of clashes between SAF and RSF forces around a contested regional population center.", "military", "al-jazeera", 13),
      news("scw-3", "Diplomatic push for renewed ceasefire talks", "Regional and international mediators renew calls for a negotiated pause in fighting.", "politics", "ap-news", 22),
    ],
  },
  "myanmar-civil-war": {
    history: [
      ["2011–2020", "A decade-long, imperfect transition from military rule toward a hybrid civilian-military democracy proceeds under Aung San Suu Kyi's government."],
      ["Feb 2021", "The military (Tatmadaw) stages a coup, arresting Suu Kyi and civilian leaders, citing unproven election-fraud claims."],
      ["2021", "Mass civil-disobedience protests are met with lethal force; opponents form a shadow National Unity Government and armed 'People's Defence Forces.'"],
      ["2021–present", "Conflict spreads nationwide as ethnic armed organizations, some allied with the resistance, seize significant territory from the junta."],
    ],
    news: [
      news("mcw-1", "Resistance forces report territorial gains", "Coverage of reported advances by allied anti-junta forces in border regions.", "military", "reuters", 11),
      news("mcw-2", "Junta announces election timeline amid ongoing conflict", "State-linked announcements on a proposed election process are met with skepticism by opposition groups.", "politics", "al-jazeera", 18),
      news("mcw-3", "Displacement crisis strains border regions", "Coverage of refugee flows into neighboring countries as fighting continues.", "society", "ap-news", 26),
    ],
  },
  "syrian-transition-conflict": {
    history: [
      ["2011", "Peaceful protests against Bashar al-Assad's government, part of the wider Arab Spring, are met with a violent crackdown and escalate into civil war."],
      ["2011–2020", "The war draws in numerous foreign powers and armed factions, including the Islamic State's territorial 'caliphate' (defeated by 2019), and displaces millions of Syrians."],
      ["Dec 2024", "A rapid rebel offensive led by Hayat Tahrir al-Sham topples the Assad government, ending over five decades of Assad family rule."],
      ["2025–present", "An interim government works to consolidate authority amid sectarian violence, a fragile relationship with Kurdish-led forces in the northeast, and continued foreign military presence."],
    ],
    news: [
      news("stc-1", "Interim government outlines transitional roadmap", "Coverage of the interim authorities' stated plans for elections and a new constitution.", "politics", "al-jazeera", 15),
      news("stc-2", "Sectarian violence reported in coastal region", "Reports of intercommunal violence in areas with concentrated minority populations.", "military", "reuters", 19),
      news("stc-3", "Kurdish-led forces negotiate integration terms", "Coverage of talks between the interim government and Kurdish-led autonomous authorities in the northeast.", "politics", "middle-east-eye", 24),
    ],
  },
  "red-sea-yemen-conflict": {
    history: [
      ["2014", "The Houthi movement seizes the capital Sanaa, prompting a Saudi-led coalition intervention in 2015 to restore the internationally recognized government."],
      ["2015–2022", "A grinding war and blockade produce a severe humanitarian crisis; a UN-brokered truce takes hold in 2022 and largely persists even after its formal expiry."],
      ["Late 2023–present", "Houthi forces begin attacking commercial and military shipping in the Red Sea and Bab-el-Mandeb Strait, prompting US/UK strikes and a rerouting of global shipping around Africa."],
    ],
    news: [
      news("ryc-1", "Shipping industry reports on Red Sea rerouting costs", "Coverage of the continued commercial impact of vessels avoiding the Red Sea corridor.", "economy", "reuters", 16),
      news("ryc-2", "Coalition strikes target Houthi military sites", "Reports on military strikes against Houthi-controlled military infrastructure.", "military", "al-jazeera", 12),
      news("ryc-3", "UN envoy renews push for political settlement", "Coverage of ongoing UN-led mediation efforts toward a broader Yemeni political settlement.", "politics", "reuters", 28),
    ],
  },
  "sahel-insurgency": {
    history: [
      ["2012", "A Tuareg rebellion in northern Mali is hijacked by jihadist groups linked to al-Qaeda, prompting a French-led military intervention in 2013."],
      ["2015 onward", "Violence spreads into Burkina Faso and Niger as groups linked to al-Qaeda and the Islamic State compete for territory and recruits."],
      ["2020–2023", "A wave of military coups in Mali, Burkina Faso, and Niger brings juntas to power that expel French and other Western forces, several turning to Russian-linked security support instead."],
      ["2023–present", "The three juntas form the Alliance of Sahel States and withdraw from the regional bloc ECOWAS, while insurgent violence continues to expand toward coastal West Africa."],
    ],
    news: [
      news("shi-1", "Junta-led governments report on counterinsurgency operations", "State-aligned coverage of military operations against jihadist groups.", "military", "france24", 20),
      news("shi-2", "Insurgent attacks reported near coastal border areas", "Coverage of the southward spread of insurgent activity toward coastal West African states.", "military", "reuters", 15),
      news("shi-3", "Alliance of Sahel States deepens security cooperation", "Coverage of coordination among the three junta-led governments on regional security.", "politics", "al-jazeera", 30),
    ],
  },
  "korean-dmz": {
    history: [
      ["1950–1953", "The Korean War, pitting the Soviet/Chinese-backed North against the US-led UN coalition defending the South, ends in an armistice rather than a peace treaty."],
      ["1953–present", "North and South Korea remain formally at war; the Demilitarized Zone is one of the most heavily fortified borders on Earth."],
      ["Recurring", "Periodic crises — nuclear and missile tests, naval skirmishes, and propaganda campaigns — punctuate the decades-long standoff without reigniting full-scale war."],
    ],
    news: [
      news("kdz-1", "North Korea conducts missile test", "Reports on a missile test and the international response.", "military", "nhk", 21),
      news("kdz-2", "Seoul and Washington hold joint military exercise", "Coverage of a scheduled joint military exercise and North Korea's reaction to it.", "military", "reuters", 17),
      news("kdz-3", "Six-party talks framework revisited by regional diplomats", "Discussion among regional powers of renewed diplomatic engagement.", "politics", "ap-news", 33),
    ],
  },
  "south-china-sea": {
    history: [
      ["Post-WWII", "Competing claims emerge as China, Taiwan, Vietnam, the Philippines, Malaysia, and Brunei assert overlapping sovereignty over islands, reefs, and waters."],
      ["2013–2016", "The Philippines brings a case against China's expansive 'nine-dash line' claim; a 2016 international tribunal ruling rejects the claim's legal basis, which China does not recognize."],
      ["2014 onward", "China builds and militarizes artificial islands on reefs it controls, alarming rival claimants and the US, which conducts regular 'freedom of navigation' patrols."],
      ["Recurring", "Coast guard and militia standoffs, particularly between China and the Philippines around Scarborough Shoal and Second Thomas Shoal, remain a persistent flashpoint."],
    ],
    news: [
      news("scs-1", "Coast guard vessels in standoff near contested shoal", "Reports of a maritime standoff involving coast guard vessels from rival claimants.", "military", "scmp", 10),
      news("scs-2", "Philippines protests resupply mission interference", "Diplomatic protest over interference with a resupply mission to a contested outpost.", "politics", "reuters", 14),
      news("scs-3", "Regional states discuss code of conduct negotiations", "Coverage of long-running talks toward a regional code of conduct for the disputed waters.", "politics", "al-jazeera", 27),
    ],
  },
  "taiwan-strait": {
    history: [
      ["1949", "Nationalist (Kuomintang) forces retreat to Taiwan after losing the Chinese Civil War to the Communist Party, establishing a rival government the People's Republic of China has never controlled."],
      ["1954–1979", "Two Taiwan Strait crises involve shelling of offshore islands; the US shifts diplomatic recognition from Taipei to Beijing in 1979 while continuing informal support for Taiwan's defense."],
      ["1996", "China conducts missile tests near Taiwan ahead of its first direct presidential election, prompting the US to deploy carrier groups to the region."],
      ["2022–present", "Chinese military aircraft and ships increase near-daily activity around Taiwan, particularly following senior foreign officials' visits to the island."],
    ],
    news: [
      news("tws-1", "Taiwan defense ministry reports incursions into air defense zone", "Daily-style reporting on the number of Chinese military aircraft detected near Taiwan.", "military", "scmp", 8),
      news("tws-2", "Arms sale package to Taiwan draws Beijing's protest", "Coverage of a foreign arms sale to Taiwan and China's diplomatic response.", "military", "reuters", 19),
      news("tws-3", "Cross-strait trade ties persist despite tensions", "Coverage of ongoing economic interdependence despite political and military tension.", "economy", "scmp", 31),
    ],
  },
  kashmir: {
    history: [
      ["1947", "Partition of British India leads to the first India-Pakistan war over the princely state of Kashmir, ending with a UN-brokered ceasefire and the Line of Control."],
      ["1965 & 1999", "Two further conflicts (including the Kargil war) are fought largely over the region."],
      ["1962", "China takes control of the Aksai Chin area during the Sino-Indian War and continues to administer it."],
      ["2019", "India revokes Jammu and Kashmir's special semi-autonomous status and splits it into two federally administered territories, tightening central control."],
    ],
    news: [
      news("ksh-1", "Cross-border firing reported along Line of Control", "Reports of an exchange of fire along the contested border.", "military", "times-of-india", 12),
      news("ksh-2", "Security forces conduct operation in border district", "Coverage of a security operation in a contested border area.", "military", "the-hindu", 17),
      news("ksh-3", "Diplomats discuss confidence-building measures", "Coverage of periodic diplomatic contacts aimed at reducing border tensions.", "politics", "reuters", 29),
    ],
  },
  crimea: {
    history: [
      ["1954", "Soviet leader Nikita Khrushchev transfers Crimea from the Russian to the Ukrainian Soviet republic; the transfer becomes an international border when the USSR dissolves in 1991."],
      ["Feb–Mar 2014", "Unmarked Russian troops seize key sites; a rushed referendum, not recognized internationally as free or fair, is followed by Russia's annexation."],
      ["2014–present", "Russia builds the Kerch Strait Bridge connecting Crimea to the Russian mainland and uses the peninsula as a key military base, including for its Black Sea Fleet."],
    ],
    news: [
      news("crm-1", "Reports of strikes on military infrastructure in Crimea", "Coverage of reported strikes on Russian military assets based on the peninsula.", "military", "kyiv-independent", 13),
      news("crm-2", "Kerch Strait Bridge security measures tightened", "State media coverage of security measures around the bridge connecting Crimea to Russia.", "military", "tass", 21),
      news("crm-3", "International bodies reaffirm non-recognition of annexation", "Coverage of continued international statements on Crimea's contested status.", "politics", "reuters", 35),
    ],
  },
  "golan-heights": {
    history: [
      ["1967", "Israel captures the Golan Heights from Syria during the Six-Day War."],
      ["1973", "Syria attempts to retake the territory in the Yom Kippur War; a UN-monitored ceasefire line is established afterward."],
      ["1981", "Israel effectively annexes the Golan Heights, a move the UN Security Council declares 'null and void.'"],
      ["2019", "The US formally recognizes Israeli sovereignty over the Golan Heights, a position not shared by the UN or most other countries."],
    ],
    news: [
      news("gol-1", "Cross-border incident reported near ceasefire line", "Coverage of an incident along the UN-monitored disengagement line.", "military", "times-of-israel", 24),
      news("gol-2", "UN observer force reports on ceasefire line status", "Periodic reporting from the UN mission monitoring the disengagement zone.", "politics", "al-jazeera", 40),
      news("gol-3", "Settlement expansion plans announced for the territory", "Coverage of Israeli government plans to expand civilian settlement in the territory.", "politics", "reuters", 32),
    ],
  },
  "west-bank-settlements": {
    history: [
      ["1967", "Israel occupies the West Bank (along with Gaza and other territories) in the Six-Day War."],
      ["1993–1995", "The Oslo Accords establish limited Palestinian self-rule in parts of the West Bank via the Palestinian Authority, dividing the territory into administrative Areas A, B, and C."],
      ["1967–present", "Israel establishes and continues to expand civilian settlements in the West Bank, considered illegal under international law by the UN and most states; several hundred thousand settlers now live across the West Bank and East Jerusalem."],
      ["2023–present", "Settler violence and Israeli military operations in the West Bank intensify alongside the Gaza war."],
    ],
    news: [
      news("wbs-1", "Settler violence incidents reported in northern West Bank", "Coverage of reported incidents of settler violence against Palestinian residents.", "society", "middle-east-eye", 9),
      news("wbs-2", "Israeli military operation conducted in refugee camp", "Coverage of a military operation in a West Bank population center.", "military", "times-of-israel", 15),
      news("wbs-3", "UN reports on settlement expansion pace", "International monitoring bodies report on the rate of settlement construction.", "politics", "al-jazeera", 38),
    ],
  },
  "western-sahara": {
    history: [
      ["1975", "Spain withdraws from its former colony; Morocco and Mauritania move in, prompting the Polisario Front to declare the Sahrawi Arab Democratic Republic and fight for independence."],
      ["1979", "Mauritania withdraws its claim; Morocco extends control over most of the territory and builds a heavily fortified sand-berm separating it from Polisario-held areas."],
      ["1991", "A UN-brokered ceasefire takes hold, monitored by a UN mission (MINURSO), premised on an independence referendum that has never been held."],
      ["2020–present", "The ceasefire frays after Polisario declares it void following a border incident; Morocco has since gained recognition of its claim from a growing number of states, including the US in 2020."],
    ],
    news: [
      news("wsh-1", "MINURSO reports on ceasefire line incidents", "Periodic UN reporting on the status of the long-running ceasefire.", "politics", "reuters", 45),
      news("wsh-2", "Morocco touts new investment in the territory", "Coverage of Moroccan government investment framed as economic development of the region.", "economy", "france24", 50),
      news("wsh-3", "Polisario Front reiterates independence demand", "Coverage of the Polisario Front's continued push for a self-determination referendum.", "politics", "al-jazeera", 60),
    ],
  },
  "nagorno-karabakh": {
    history: [
      ["1988–1994", "As Soviet control weakens, ethnic Armenian-majority Nagorno-Karabakh seeks to join Armenia, sparking a war with Azerbaijan that ends with Armenian forces in control of the region and surrounding territory."],
      ["2020", "A 44-day war ends with Azerbaijan retaking significant territory, formalized in a Russian-brokered ceasefire that stations Russian peacekeepers in the region."],
      ["Sep 2023", "A swift Azerbaijani military offensive retakes the remainder of the region within 24 hours, prompting nearly the entire ethnic Armenian population — roughly 100,000 people — to flee to Armenia."],
      ["2023–present", "Talks continue toward a formal Armenia-Azerbaijan peace treaty, with border demarcation and transit-corridor questions still unresolved."],
    ],
    news: [
      news("nkh-1", "Armenia and Azerbaijan resume border talks", "Coverage of ongoing bilateral talks toward a peace treaty.", "politics", "reuters", 40),
      news("nkh-2", "Displaced Karabakh Armenians describe resettlement challenges", "Coverage of the humanitarian situation for those displaced in 2023.", "society", "al-jazeera", 55),
      news("nkh-3", "Transit corridor negotiations remain unresolved", "Coverage of disputed proposals for a transit corridor through southern Armenia.", "politics", "ap-news", 65),
    ],
  },
  transnistria: {
    history: [
      ["1990", "As Moldova moves toward independence from the USSR, the Russian-speaking Transnistria region on the east bank of the Dniester River declares its own breakaway republic."],
      ["1992", "A brief war ends with a ceasefire brokered by Russia, which leaves a residual military force in the region that remains today."],
      ["1992–present", "Transnistria functions as an unrecognized state with its own government, currency, and army, dependent on Russian support and subsidized energy."],
      ["Recurring", "Tensions periodically rise around Moldova's EU integration path and disruptions to the gas transit arrangements that have historically subsidized the region."],
    ],
    news: [
      news("tns-1", "Moldova reports on regional energy security plans", "Coverage of Moldovan government efforts to reduce dependence on regional gas transit arrangements.", "economy", "reuters", 48),
      news("tns-2", "Transnistrian authorities comment on Moldova's EU path", "Coverage of statements from the breakaway region's authorities amid Moldova's EU accession process.", "politics", "ap-news", 58),
      news("tns-3", "OSCE mission reports on regional security dialogue", "Periodic reporting from international monitors on the long-running dispute.", "politics", "kyiv-independent", 70),
    ],
  },
};

const conflicts = JSON.parse(readFileSync(PATH, "utf-8"));

let updated = 0;
for (const conflict of conflicts) {
  const extra = CONTENT[conflict.id];
  if (!extra) {
    console.warn(`No history/news content defined for conflict id "${conflict.id}" — left as-is.`);
    continue;
  }
  conflict.history = extra.history.map(([period, text]) => ({ period, text }));
  conflict.news = extra.news;
  updated++;
}

writeFileSync(PATH, JSON.stringify(conflicts, null, 2) + "\n");
console.log(`Merged history + news into ${updated}/${conflicts.length} conflicts.`);

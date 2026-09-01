import { chromium } from "playwright-core";

const errors = [];
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push("pageerror: " + err.message));

await page.goto("http://localhost:8123/index.html", { waitUntil: "networkidle" });
await page.waitForSelector("#boot-screen.hidden, #boot-screen:not([class])", { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(1500);

const mapPaths = await page.$$eval(".country-shape", (els) => els.length);
console.log("country paths rendered:", mapPaths);

const hasDataCountry = await page.$('.country-shape.has-data');
if (hasDataCountry) {
  await hasDataCountry.click();
  await page.waitForTimeout(500);
  const panelVisible = await page.$eval("#panel-content", (el) => !el.hidden);
  console.log("panel opened on country click:", panelVisible);
  const cardCount = await page.$$eval(".news-card", (els) => els.length);
  console.log("news cards rendered:", cardCount);

  const tabBtn = await page.$('.panel-tab[data-tab="developing"]');
  if (tabBtn) {
    await tabBtn.click();
    await page.waitForTimeout(300);
    console.log("developing cards:", await page.$$eval(".news-card", (els) => els.length));
  }
} else {
  console.log("NO has-data country hittable");
}

const conflictMarker = await page.$(".conflict-marker circle.marker-core");
if (conflictMarker) {
  await conflictMarker.click({ force: true });
  await page.waitForTimeout(500);
  const title = await page.$eval(".panel-title", (el) => el.textContent).catch(() => null);
  console.log("conflict panel title:", title);
}

await page.fill("#search-input", "Ukraine");
await page.waitForTimeout(200);
console.log("search results visible:", await page.$eval("#search-results", (el) => !el.hidden));

await page.screenshot({ path: "/tmp/claude-0/-home-user-Global-News-Ares/e013b696-ba85-5974-9d6a-c6802aa6ffcd/scratchpad/screenshot-full.png" });

console.log("console/page errors:", JSON.stringify(errors, null, 2));

await browser.close();
process.exit(errors.length ? 1 : 0);

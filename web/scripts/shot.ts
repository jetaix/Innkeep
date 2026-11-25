import { chromium } from "playwright-core";

/**
 * Takes a picture of one page of the running app, for looking at a change.
 *
 *   bun scripts/shot.ts /revenue out.png [--mobile] [--dark] [--en] [--full] [--port 5174]
 */
const [route = "/overview", out = "shot.png", ...flags] = process.argv.slice(2);
const has = (flag: string) => flags.includes(flag);
const port = flags.includes("--port") ? flags[flags.indexOf("--port") + 1] : "5174";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: has("--mobile") ? { width: 390, height: 844 } : { width: 1360, height: 900 },
  deviceScaleFactor: has("--mobile") ? 2 : 1,
  colorScheme: has("--dark") ? "dark" : "light",
  locale: has("--en") ? "en-GB" : "fr-FR",
});
await context.addCookies([
  { name: "innkeep-locale", value: has("--en") ? "en" : "fr", url: `http://localhost:${port}` },
]);
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto(`http://localhost:${port}${route}`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.screenshot({ path: out, fullPage: has("--full") });
// A page that scrolls sideways on a phone is a defect: say so.
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
if (overflow > 0) console.log(`sideways overflow: ${overflow}px`);
for (const error of errors) console.log(`page error: ${error}`);
await browser.close();

// Smoke check: build/page.html opens, the home page fills in, and every knowledge point's page
// shows its 3D experiment without a script error. Needs Playwright (npx playwright, or a global install).
// Usage: node scripts/smoke.mjs [build/page.html]
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('smoke: Playwright is not installed (npm i -g playwright && npx playwright install chromium)');
  process.exit(2);
}
const page = path.resolve(process.argv[2] || 'build/page.html');
if (!fs.existsSync(page)) {
  console.error(`smoke: ${page} is missing; run npm run build first`);
  process.exit(2);
}
const kps = JSON.parse(fs.readFileSync(new URL('../src/kp.json', import.meta.url), 'utf8'));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const tab = await ctx.newPage();
const errors = [];
tab.on('pageerror', (e) => errors.push(`${tab.url().split('#')[1] || 'home'}: ${e.message}`));
const url = pathToFileURL(page).href;
await tab.goto(url);
await tab.waitForFunction(() => document.querySelector('#heroT')?.textContent.trim().length > 0, null, { timeout: 15000 });
const failed = [];
for (const kp of kps) {
  await tab.evaluate((h) => (location.hash = h), `kp-${kp.id}`);
  try {
    await tab.waitForFunction(() => [...document.querySelectorAll('canvas')].some((c) => c.offsetWidth > 0 && c.offsetHeight > 0), null, { timeout: 8000 });
  } catch {
    failed.push(`kp-${kp.id} ${kp.t}: no visible 3D canvas`);
  }
}
await browser.close();
for (const f of [...failed, ...errors]) console.error('smoke: ' + f);
if (failed.length || errors.length) process.exit(1);
console.log(`smoke: home and ${kps.length} knowledge points render without errors`);

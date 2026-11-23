// Captures real screenshots of the generated sample reports for the documentation.
// Needs Playwright and a browser (Microsoft Edge or Chromium). Usage: node scripts/capture-images.mjs
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'documents', 'rachnasutra', 'images');
mkdirSync(out, { recursive: true });
const { chromium } = await import('playwright');
let browser;
for (const opts of [{ channel: 'msedge' }, { channel: 'chrome' }, {}]) {
  try { browser = await chromium.launch(opts); break; } catch { /* try next */ }
}
if (!browser) throw new Error('No browser available for Playwright');

async function shot(file, name, vp, full = true) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, colorScheme: 'light' });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(path.join(root, file)).href);
  await page.screenshot({ path: path.join(out, name), fullPage: full });
  await ctx.close();
}
await shot('samples/broken-ui/latest.html', 'report-desktop.png', { width: 1200, height: 900 }, false);
await shot('samples/broken-ui/latest.html', 'report-full.png', { width: 1100, height: 900 }, true);
await shot('samples/broken-ui/latest.html', 'report-mobile.png', { width: 390, height: 844 }, false);
await shot('samples/good-ui/latest.html', 'report-clean.png', { width: 1100, height: 700 }, false);
await browser.close();
console.log('captured');

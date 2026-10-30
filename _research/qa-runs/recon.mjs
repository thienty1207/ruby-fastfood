// Recon driver: load target, inject probes, capture surface map + tokens + motion + screenshots.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL = 'https://www.cravburgers.shop/';
const OUT = process.cwd();
const BUNDLE = fs.readFileSync(path.join(OUT, 'probes.bundle.js'), 'utf8');

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-gpu', '--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
});
const page = await ctx.newPage();

await page.addInitScript({ content: BUNDLE });
await page.addInitScript(() => {
  const g = window;
  if (g.instrumentGetContext) g.instrumentGetContext();
  if (g.instrumentMotion) g.instrumentMotion();
});

const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`.slice(0, 300)));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`.slice(0, 300)));

console.log('navigating…');
const resp = await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
console.log('status', resp?.status());
await page.waitForTimeout(6000);

// scroll top->bottom to trigger lazy init
const height = await page.evaluate(() => document.body.scrollHeight);
let y = 0;
while (y < height) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(300);
  y += 700;
  if (y > 30000) break;
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(2500);

// surface map
try {
  const sm = await page.evaluate(() => window.surfaceMap());
  fs.writeFileSync(path.join(OUT, 'surface-map.json'), JSON.stringify(sm, null, 2));
  console.log('surface map ok, canvases:', sm.surfaces?.length);
} catch (e) {
  console.log('surfaceMap err', e.message);
}

// motion summary + full
try {
  const ms = await page.evaluate(() => window.motionSummary());
  console.log('MOTION SUMMARY:', JSON.stringify(ms));
  const mp = await page.evaluate(() => window.motionProbe());
  fs.writeFileSync(path.join(OUT, 'motion.json'), JSON.stringify(mp, null, 2));
} catch (e) {
  console.log('motion err', e.message);
}

// tokens at 3 widths
for (const w of [1440, 768, 390]) {
  await page.setViewportSize({ width: w, height: w === 1440 ? 900 : w === 768 ? 1024 : 844 });
  await page.waitForTimeout(1200);
  try {
    const tp = await page.evaluate(() => window.tokensProbe());
    fs.writeFileSync(path.join(OUT, `tokens-${w}.json`), JSON.stringify(tp, null, 2));
    console.log('tokens', w, 'ok');
  } catch (e) {
    console.log('tokens err', w, e.message);
  }
}

// full page screenshot at 1440
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(1200);
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
await page.screenshot({ path: path.join(OUT, 'shots', 'orig-1440-full.png'), fullPage: true });
await page.screenshot({ path: path.join(OUT, 'shots', 'orig-1440-hero.png') });

fs.writeFileSync(path.join(OUT, 'console.log'), logs.join('\n'));
console.log('done. logs:', logs.length);
await browser.close();

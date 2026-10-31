import { chromium } from 'playwright';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'qa-final');
import fs from 'node:fs';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);

const H = await page.evaluate(() => document.body.scrollHeight);
// settle all reveals
for (let y = 0; y < H; y += 700) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(260);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(2500);

const picks = [
  ['01-hero', 0],
  ['02-about', 1250],
  ['03-experience', 3300],
  ['04-ingredients', 5200],
  ['05-map', 6300],
  ['06-map2', 7800],
  ['07-cta', 8900],
  ['08-footer', 9700],
];
for (const [name, y] of picks) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log('shot', name, '@', y);
}
await browser.close();

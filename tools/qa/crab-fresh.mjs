// Fresh capture: is the crab dark because of opacity, or does it LOOK dark
// because the crop box is wider than the artwork (transparent padding)?
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-crab2');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3200);

const secTop = await page.evaluate(() => {
  const s = document.querySelector('[data-rk-jr]');
  return Math.round(s.getBoundingClientRect().top + window.scrollY);
});
const secH = await page.evaluate(() => Math.round(document.querySelector('[data-rk-jr]').offsetHeight));

// go to the point where the crab sits mid-screen and clearly visible
const y = Math.round(secTop + (secH - 900) * 0.55);
await page.evaluate((yy) => window.scrollTo(0, yy), y);
await page.waitForTimeout(1500);

const st = await page.evaluate(() => {
  const crab = document.querySelector('[data-rk-jr-crab]');
  const img = crab.querySelector('img');
  const r = img.getBoundingClientRect();
  const cs = getComputedStyle(img);
  return {
    crabOpacity: getComputedStyle(crab).opacity,
    imgOpacity: cs.opacity,
    imgFilter: cs.filter,
    imgTransform: cs.transform,
    imgBox: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
    naturalW: img.naturalWidth,
    naturalH: img.naturalHeight,
    zIndex: getComputedStyle(crab).zIndex,
  };
});
console.log(JSON.stringify(st, null, 2));

// full-viewport shot (what the user sees)
await page.screenshot({ path: path.join(OUT, 'viewport.png') });

// tight crop on the crab image box
const c = st.imgBox;
const clip = {
  x: Math.max(0, c.x),
  y: Math.max(0, c.y),
  width: Math.min(c.w, 1440 - Math.max(0, c.x)),
  height: Math.min(c.h, 900 - Math.max(0, c.y)),
};
if (clip.width > 20 && clip.height > 20) {
  await page.screenshot({ path: path.join(OUT, 'crab-tight.png'), clip });
  console.log('tight crop:', JSON.stringify(clip));
}
await browser.close();

// Capture the motion sequence: hero -> transition -> cards -> sticky release.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-motion');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3500);

const docH = await page.evaluate(() => document.body.scrollHeight);
const vh = 900;
// walk the whole page in ~120px steps so scrubbed states are mid-flight
const shots = [];
let i = 0;
for (let y = 0; y <= docH - vh; y += 120) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(260);
  // capture only a meaningful subset
  if (y % 480 === 0 && i < 14) {
    const f = path.join(OUT, `walk-${String(i).padStart(2, '0')}.png`);
    await page.screenshot({ path: f });
    shots.push({ i, y });
    i++;
  }
}
console.log('docH', docH, 'shots', shots.length);
console.log(shots.map((s) => `w${s.i}@y${s.y}`).join(' '));

// also grab the hero->menu handoff specifically
const heroBottom = await page.evaluate(() => {
  const h = document.querySelector('[data-rk-hero]');
  return Math.round(h.getBoundingClientRect().height);
});
for (const [tag, y] of [
  ['handoff-a', heroBottom - 700],
  ['handoff-b', heroBottom - 480],
  ['handoff-c', heroBottom - 260],
  ['handoff-d', heroBottom - 60],
]) {
  await page.evaluate((yy) => window.scrollTo(0, Math.max(0, yy)), y);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, `${tag}.png`) });
}
console.log('handoff captured, hero height', heroBottom);
await browser.close();

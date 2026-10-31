// Capture a card at precise points inside its scrub band to prove the motion is
// scroll-linked (not a one-shot fade).
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

const band = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('[data-rk-sig-card]')];
  const c = cards[1]; // second card
  const top = c.getBoundingClientRect().top + window.scrollY;
  return {
    start: Math.round(top - window.innerHeight * 0.92),
    end: Math.round(top - window.innerHeight * 0.42),
  };
});
console.log('card2 band:', JSON.stringify(band));

const points = [0, 0.25, 0.5, 0.75, 1];
for (const p of points) {
  const y = Math.round(band.start + (band.end - band.start) * p);
  await page.evaluate((yy) => window.scrollTo(0, Math.max(0, yy)), y);
  await page.waitForTimeout(1800); // let scrub:0.8 settle fully
  const state = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-rk-sig-card]')];
    const c = cards[1];
    const shell = c.querySelector('[data-rk-sig-shell]');
    const media = c.querySelector('[data-rk-sig-media-inner]');
    const name = c.querySelector('[data-rk-sig-el="name"]');
    const price = c.querySelector('[data-rk-sig-el="price"]');
    const g = (el, p) => (el ? getComputedStyle(el)[p] : 'n/a');
    const ty = (el) => {
      const m = g(el, 'transform');
      if (!m || m === 'none') return 'none';
      const n = m.match(/matrix\(([^,]+),[^,]+,[^,]+,[^,]+,[^,]+,\s*([^)]+)\)/);
      return n ? `scale=${Number(n[1]).toFixed(2)} y=${Number(n[2]).toFixed(1)}` : m.slice(0, 30);
    };
    return {
      y: Math.round(window.scrollY),
      shellOp: Number(g(shell, 'opacity')).toFixed(2),
      shell: ty(shell),
      media: ty(media),
      nameOp: Number(g(name, 'opacity')).toFixed(2),
      priceOp: Number(g(price, 'opacity')).toFixed(2),
    };
  });
  console.log(`p=${p.toFixed(2)} ${JSON.stringify(state)}`);
  await page.screenshot({
    path: path.join(OUT, `card2-${String(Math.round(p * 100)).padStart(3, '0')}.png`),
  });
}
await browser.close();

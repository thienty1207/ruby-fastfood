// Isolate the crab: capture just its bounding box at several scroll points and
// report the exact computed colour of its pixels via a clip screenshot.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-crab');
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

let i = 0;
for (const p of [0.15, 0.35, 0.55, 0.75, 0.92]) {
  const y = Math.round(secTop + (secH - 900) * p);
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(800);
  const box = await page.evaluate(() => {
    const crab = document.querySelector('[data-rk-jr-crab]');
    const r = crab.getBoundingClientRect();
    // what is painted on top of the crab centre?
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const top = document.elementFromPoint(
      Math.max(1, Math.min(window.innerWidth - 2, cx)),
      Math.max(1, Math.min(window.innerHeight - 2, cy)),
    );
    return {
      left: Math.round(r.left),
      top: Math.round(r.top),
      w: Math.round(r.width),
      h: Math.round(r.height),
      onTop: top
        ? `${top.tagName.toLowerCase()}.${(typeof top.className === 'string' ? top.className : '').split(' ')[0]}`
        : 'none',
      onTopIsCrab: top ? !!top.closest('[data-rk-jr-crab]') : false,
      inViewport: r.top < 900 && r.bottom > 0 && r.left < 1440 && r.right > 0,
    };
  });
  console.log(`p=${p.toFixed(2)}`, JSON.stringify(box));

  // clip screenshot around the crab
  const clip = {
    x: Math.max(0, Math.min(1440 - 20, box.left - 10)),
    y: Math.max(0, Math.min(900 - 20, box.top - 10)),
    width: Math.min(Math.max(40, box.w + 20), 1440 - Math.max(0, Math.min(1440 - 20, box.left - 10))),
    height: Math.min(Math.max(40, box.h + 20), 900 - Math.max(0, Math.min(900 - 20, box.top - 10))),
  };
  if (clip.width > 30 && clip.height > 30) {
    await page.screenshot({ path: path.join(OUT, `crab-${i}.png`), clip });
  }
  i++;
}
await browser.close();

// Verify the crab travels on MOBILE too (the reported bug).
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-mob');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const w of [375, 768]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 812 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3200);

  const geo = await page.evaluate(() => {
    const s = document.querySelector('[data-rk-jr]');
    const crab = document.querySelector('[data-rk-jr-crab]');
    const r = crab.getBoundingClientRect();
    return {
      secTop: Math.round(s.getBoundingClientRect().top + window.scrollY),
      secH: Math.round(s.offsetHeight),
      crabW: Math.round(r.width),
      crabLeft: Math.round(r.left),
      crabTop: Math.round(r.top + window.scrollY),
    };
  });
  console.log(`\n=== ${w}px === section h=${geo.secH} crab ${geo.crabW}px`);

  const positions = [];
  for (const p of [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95]) {
    const y = Math.round(geo.secTop + (geo.secH - 812) * p);
    await page.evaluate((yy) => window.scrollTo(0, yy), Math.max(0, y));
    await page.waitForTimeout(700);
    const s = await page.evaluate(() => {
      const crab = document.querySelector('[data-rk-jr-crab]');
      const r = crab.getBoundingClientRect();
      const m = getComputedStyle(crab).transform;
      return {
        scrollY: Math.round(window.scrollY),
        left: Math.round(r.left),
        top: Math.round(r.top),
        rot: getComputedStyle(crab).rotate,
        tf: m === 'none' ? 'none' : m.slice(0, 40),
        opacity: getComputedStyle(crab).opacity,
      };
    });
    positions.push(s);
    const bar = ' '.repeat(0);
    console.log(`  p=${p.toFixed(2)} y=${String(s.scrollY).padStart(5)} crab(${String(s.left).padStart(4)}, ${String(s.top).padStart(4)}) op=${s.opacity}`);
  }

  const moved = new Set(positions.map((p) => `${p.left},${p.top}`)).size;
  console.log(`  distinct positions: ${moved}/7 ${moved > 3 ? 'MOVING ✓' : 'STATIC ✗'}`);
  console.log(`  errors: ${errs.length ? errs[0] : 'none'}`);

  // screenshot mid-section
  const y = Math.round(geo.secTop + (geo.secH - 812) * 0.4);
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.max(0, y));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, `${w}-mid.png`) });
  await ctx.close();
}
await browser.close();

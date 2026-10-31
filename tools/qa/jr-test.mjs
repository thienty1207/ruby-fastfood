// Verify the crab travels the dashed route and pins pop at the same thresholds.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-jr');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errs.push(m.text().slice(0, 140));
});
page.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url().split('/').pop()));

await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3500);

const exists = await page.evaluate(() => {
  const s = document.querySelector('[data-rk-jr]');
  if (!s) return null;
  return {
    docH: document.body.scrollHeight,
    sectionH: Math.round(s.offsetHeight),
    crab: !!document.querySelector('[data-rk-jr-crab]'),
    route: !!document.querySelector('[data-rk-jr-route]'),
    pins: document.querySelectorAll('[data-rk-jr-pin]').length,
    bg: getComputedStyle(s).backgroundColor,
  };
});
if (!exists) {
  console.log('SECTION NOT FOUND');
  await browser.close();
  process.exit(1);
}
console.log('SECTION:', JSON.stringify(exists));

// walk through, record crab transform + visible pin count
const secTop = await page.evaluate(() => {
  const s = document.querySelector('[data-rk-jr]');
  return Math.round(s.getBoundingClientRect().top + window.scrollY);
});
const secH = exists.sectionH;

console.log('\nprogress | crab x,y | visible pins');
for (const p of [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1]) {
  const y = Math.round(secTop + (secH - 900) * p);
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.max(0, y));
  await page.waitForTimeout(750);
  const s = await page.evaluate(() => {
    const crab = document.querySelector('[data-rk-jr-crab]');
    const m = getComputedStyle(crab).transform;
    let x = 'n/a';
    let yy = 'n/a';
    const mm = m.match(/matrix\(([^)]+)\)/);
    if (mm) {
      const parts = mm[1].split(',').map(Number);
      x = parts[4].toFixed(0);
      yy = parts[5].toFixed(0);
    }
    const pins = [...document.querySelectorAll('[data-rk-jr-pin]')];
    const vis = pins.filter((el) => Number(getComputedStyle(el).opacity) > 0.5).length;
    return { x, y: yy, vis, scrollY: Math.round(window.scrollY) };
  });
  const bar = '#'.repeat(s.vis);
  console.log(`  ${String(Math.round(p * 100)).padStart(3)}%  y=${String(s.scrollY).padStart(5)}  crab(${s.x}, ${s.y})  pins=${s.vis} ${bar}`);
}

// screenshots
for (const [tag, p] of [['a', 0.1], ['b', 0.45], ['c', 0.8]]) {
  const y = Math.round(secTop + (secH - 900) * p);
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.max(0, y));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, `jr-${tag}.png`) });
}

console.log('\nerrors:', errs.length ? errs.slice(0, 4).join(' | ') : 'none');
await browser.close();

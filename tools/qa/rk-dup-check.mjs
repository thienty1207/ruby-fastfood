// Duplicate-check: DOM node counts + inline transform state must be identical
// after many resizes. (gsap is bundled, so window.gsap is not available —
// counting the nodes the animations mutate is the reliable proxy.)
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });

await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3500);

const snap = () =>
  page.evaluate(() => ({
    hero: document.querySelectorAll('[data-rk-hero]').length,
    nav: document.querySelectorAll('[data-rk-nav]').length,
    mascot: document.querySelectorAll('[data-rk-mascot]').length,
    lines: document.querySelectorAll('[data-rk-line]').length,
    badges: document.querySelectorAll('[data-rk-badge]').length,
    checkers: document.querySelectorAll('[data-rk-checker]').length,
    sheet: document.querySelectorAll('[data-rk-sheet]').length,
    titleTransform: getComputedStyle(document.querySelector('.rk-hero__title')).transform.slice(0, 42),
    mascotTransform: getComputedStyle(document.querySelector('[data-rk-mascot]')).transform.slice(0, 42),
  }));

const before = await snap();
for (const w of [1200, 900, 1440, 1024, 375, 1440]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(360);
}
const after = await snap();

console.log('before:', JSON.stringify(before));
console.log('after :', JSON.stringify(after));
const keys = Object.keys(before);
const diffs = keys.filter((k) => before[k] !== after[k]);
console.log(diffs.length ? `DIFFERS in: ${diffs.join(', ')}` : 'IDENTICAL after 6 resizes ✓');
console.log('errors:', errs.length ? errs.slice(0, 4).join(' | ') : 'none');
await browser.close();

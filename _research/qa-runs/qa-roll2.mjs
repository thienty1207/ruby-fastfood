import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4500);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1800);

// Tailwind v4 writes the `translate` property, not `transform`.
const readRoll = () =>
  page.evaluate(() => {
    const wrap = document.querySelector('footer nav a span.overflow-hidden');
    if (!wrap) return null;
    const first = wrap.querySelector(':scope > span:first-child');
    const second = wrap.querySelector('span.absolute');
    const g = (el) => (el ? { translate: getComputedStyle(el).translate, transform: getComputedStyle(el).transform } : null);
    return { first: g(first), second: g(second) };
  });

console.log('BEFORE hover:', JSON.stringify(await readRoll()));
const link = await page.$('footer nav a');
await link.hover();
await page.waitForTimeout(700);
const after = await readRoll();
console.log('AFTER  hover:', JSON.stringify(after));

const ok =
  after?.first?.translate !== 'none' ||
  after?.second?.translate !== 'none' ||
  (after?.second?.translate || '').includes('0');
console.log('rolling label animates on hover:', ok ? 'YES ✓' : 'NO ✗');

// also confirm the nav "Burgers" pill (same atom) rolls
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(900);
const pillBefore = await page.evaluate(() => {
  const w = document.querySelector('nav a.font-mouse-memoirs span.overflow-hidden');
  return w ? getComputedStyle(w.querySelector('span.absolute')).translate : null;
});
await page.hover('nav a.font-mouse-memoirs');
await page.waitForTimeout(600);
const pillAfter = await page.evaluate(() => {
  const w = document.querySelector('nav a.font-mouse-memoirs span.overflow-hidden');
  return w ? getComputedStyle(w.querySelector('span.absolute')).translate : null;
});
console.log(`nav pill roll: ${pillBefore} -> ${pillAfter}  changed=${pillBefore !== pillAfter}`);

await browser.close();

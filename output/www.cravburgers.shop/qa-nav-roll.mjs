import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4500);

// ---- NAV: hide on down, show on up (the bug we just fixed) ----
const navY = () => page.evaluate(() => Math.round(new DOMMatrix(getComputedStyle(document.querySelector('nav')).transform).m42));
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(900);
console.log('nav @top           :', await navY());
await page.mouse.move(700, 500);
await page.mouse.wheel(0, 900);
await page.waitForTimeout(1400);
const hiddenY = await navY();
console.log('nav after scroll dn:', hiddenY, hiddenY < -20 ? 'HIDDEN ✓' : 'NOT HIDDEN ✗');
await page.mouse.wheel(0, -400);
await page.waitForTimeout(1400);
const shownY = await navY();
console.log('nav after scroll up:', shownY, Math.abs(shownY) < 3 ? 'SHOWN ✓' : 'STUCK ✗');

// ---- ROLLING LABEL: target the actual markup (.overflow-hidden.relative.inline-block.group) ----
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1800);
const readRoll = () =>
  page.evaluate(() => {
    const wrap = document.querySelector('footer nav a span.overflow-hidden');
    if (!wrap) return null;
    const second = wrap.querySelector('span.absolute');
    const first = wrap.querySelector(':scope > span:first-child');
    return {
      first: first ? getComputedStyle(first).transform : null,
      second: second ? getComputedStyle(second).transform : null,
    };
  });
console.log('roll BEFORE hover:', JSON.stringify(await readRoll()));
const link = await page.$('footer nav a');
if (link) await link.hover();
await page.waitForTimeout(600);
console.log('roll AFTER  hover:', JSON.stringify(await readRoll()));
const changed = await page.evaluate(() => {
  const wrap = document.querySelector('footer nav a span.overflow-hidden');
  const second = wrap?.querySelector('span.absolute');
  if (!second) return false;
  const m = getComputedStyle(second).transform.match(/matrix\(([^)]+)\)/);
  return m ? Math.abs(Number(m[1].split(',')[5])) < 1 : false;
});
console.log('roll hover changed:', changed ? 'YES ✓' : 'NO ✗');

await browser.close();

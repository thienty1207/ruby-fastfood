// Measure the crab's opacity across the section — is the fade the cause, or is
// it something else (filter, blend, parent opacity)?
import { chromium } from 'playwright';

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

for (const p of [0.1, 0.3, 0.5, 0.7, 0.9]) {
  const y = Math.round(secTop + (secH - 900) * p);
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(800);
  const s = await page.evaluate(() => {
    const crab = document.querySelector('[data-rk-jr-crab]');
    const img = crab.querySelector('img');
    const cs = getComputedStyle(crab);
    const r = crab.getBoundingClientRect();
    return {
      inlineOpacity: crab.style.opacity || '(unset)',
      computedOpacity: cs.opacity,
      computedFilter: cs.filter,
      imgOpacity: getComputedStyle(img).opacity,
      imgFilter: getComputedStyle(img).filter,
      rectLeft: Math.round(r.left),
      width: Math.round(r.width),
      parentOpacity: getComputedStyle(crab.parentElement).opacity,
    };
  });
  console.log(`p=${p.toFixed(1)}`, JSON.stringify(s));
}
await browser.close();

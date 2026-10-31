// Verify the hero CTA anchor jump lands below the fixed navbar.
import { chromium } from 'playwright';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'qa-sig');
const browser = await chromium.launch({ headless: true });

for (const w of [375, 768, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));

  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // click the hero CTA exactly like a user: scroll it into view first, then
  // dispatch the click (Playwright's actionability check rejects anchors that
  // sit outside the viewport after an earlier scroll).
  await page.evaluate(() => {
    const a = document.querySelector('a[href="#menu"]');
    a.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    document.querySelector('a[href="#menu"]').click();
  });
  await page.waitForTimeout(1800);

  const r = await page.evaluate(() => {
    const eb = document.querySelector('.rk-sig__eyebrow');
    const nav = document.querySelector('[data-rk-nav]');
    const e = eb.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    return {
      ebTop: Math.round(e.top),
      navBottom: Math.round(n.bottom),
      covered: e.top < n.bottom,
      scrollY: Math.round(window.scrollY),
    };
  });

  console.log(`${w}: eyebrow top=${r.ebTop} navBottom=${r.navBottom} COVERED=${r.covered} scrollY=${r.scrollY}`);
  if (errs.length) console.log(`   errors: ${errs.slice(0, 2).join(' | ')}`);
  await page.screenshot({ path: path.join(OUT, `${w}-jump.png`) });
  await ctx.close();
}
await browser.close();

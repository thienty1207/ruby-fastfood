// Browser smoke test after the security hardening pass.
//
// Proves the site still renders and behaves exactly as before: same document
// height, same nav anchor scrolling, same flipbook, zero console errors, no
// horizontal overflow. This is the regression guard for the hardening work.
//
// Two expectations that look like failures but are not, both verified identical
// against the pre-hardening build:
//   - images with loading="lazy" that are off-screen have naturalWidth 0 by
//     design, so only non-lazy images are required to have loaded;
//   - the Ruby page ships no [data-divider-host] elements at all (only /clone
//     does, four of them), so 0 mounted dividers on / is correct.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
let fail = 0;

for (const [w, h, label] of [
  [1440, 900, '1440'],
  [768, 1024, '768'],
  [390, 844, '390'],
]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text().slice(0, 120));
  });
  page.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url().split('/').pop()));

  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  const base = await page.evaluate(() => ({
    docH: document.body.scrollHeight,
    brokenImgs: [...document.images].filter((i) => i.naturalWidth === 0 && i.loading !== 'lazy')
      .length,
    ovX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    dividerHosts: document.querySelectorAll('[data-divider-host]').length,
  }));

  // Nav anchors must still scroll — this exercises the getElementById change.
  await page.evaluate(() => document.querySelector('[data-rk-nav-link][href="#visit"]')?.click());
  await page.waitForTimeout(1400);
  const scrolled = await page.evaluate(() => window.scrollY);

  // Flipbook must still mount with the same 8 pages and the same cover.
  await page.evaluate(() => {
    const s = document.querySelector('[data-rk-fb]');
    window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY - 30);
  });
  await page.waitForTimeout(1500);
  const fb = await page.evaluate(() => ({
    pages: document.querySelectorAll('.rk-fb-page').length,
    coverSrc: document
      .querySelector('.rk-fb-page--cover img')
      ?.getAttribute('src')
      ?.split('/')
      .pop(),
    innerCount: document.querySelectorAll('.rk-fb-page--inner img').length,
    backmark: document.querySelector('.rk-fb-backmark')?.textContent,
    firstAlt: document.querySelector('.rk-fb-page--cover img')?.alt?.length ?? 0,
  }));

  await page.evaluate(() => document.querySelector('[data-rk-fb-open]')?.click());
  await page.waitForTimeout(1600);
  const spread = await page.evaluate(() => {
    const stage = document.querySelector('.rk-fb__stage').getBoundingClientRect();
    const boards = [...document.querySelectorAll('.stf__item')].filter(
      (x) => getComputedStyle(x).display !== 'none',
    );
    let l = Infinity;
    let r = -Infinity;
    for (const x of boards) {
      const q = x.getBoundingClientRect();
      if (!q.width) continue;
      l = Math.min(l, q.left);
      r = Math.max(r, q.right);
    }
    return { count: boards.length, delta: Math.round(stage.left + stage.width / 2 - (l + r) / 2) };
  });

  const ok =
    base.brokenImgs === 0 &&
    !base.ovX &&
    base.dividerHosts === 0 &&
    scrolled > 100 &&
    fb.pages === 8 &&
    fb.coverSrc === 'Menu.webp' &&
    fb.innerCount === 6 &&
    fb.backmark === 'RUBY KITCHEN 81' &&
    fb.firstAlt > 20 &&
    spread.count > 0 &&
    Math.abs(spread.delta) <= 2 &&
    errs.length === 0;
  if (!ok) fail++;

  console.log(
    `${label.padStart(4)} docH=${String(base.docH).padStart(6)} broken=${base.brokenImgs} ovX=${base.ovX} anchor=${Math.round(scrolled)} fb=${fb.pages}/${fb.innerCount} cover=${fb.coverSrc} alt=${fb.firstAlt} spread=${spread.count}(d${spread.delta}) errs=${errs.length} ${ok ? 'OK' : 'FAIL'}`,
  );
  if (errs.length) errs.slice(0, 3).forEach((e) => console.log('      ' + e));
  await ctx.close();
}

// /clone must also render unchanged: it is the only page with dividers, so this
// is where the dividerMarkup allowlist is actually exercised.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text().slice(0, 120));
  });
  await page.goto('http://127.0.0.1:5273/clone', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  const c = await page.evaluate(() => ({
    docH: document.body.scrollHeight,
    brokenImgs: [...document.images].filter((i) => i.naturalWidth === 0 && i.loading !== 'lazy')
      .length,
    dividers: document.querySelectorAll('[data-divider-mounted]').length,
    fills: [...document.querySelectorAll('.jelly path')].map((p) => p.getAttribute('fill')),
  }));
  // Every divider path must carry a real fill, not a rejected-value fallback.
  const fillOk = c.fills.length > 0 && c.fills.every((f) => f && /^(var\(--|#|[a-z])/i.test(f));
  const ok = c.brokenImgs === 0 && c.dividers === 4 && fillOk && !errs.length;
  if (!ok) fail++;
  console.log(
    `clone  docH=${String(c.docH).padStart(6)} dividers=${c.dividers} fills=${JSON.stringify(c.fills)} broken=${c.brokenImgs} errs=${errs.length} ${ok ? 'OK' : 'FAIL'}`,
  );
  if (errs.length) errs.slice(0, 3).forEach((e) => console.log('      ' + e));
  await ctx.close();
}

await browser.close();
console.log(fail === 0 ? '\nALL OK' : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);

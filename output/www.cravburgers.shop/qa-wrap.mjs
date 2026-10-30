import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const vp = { width: 768, height: 1024 };

async function probe(url) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(7500);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /okay|accept/i.test(x.textContent || ''));
    b?.click();
  });
  const H = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 450) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1800);

  const out = await page.evaluate(() => {
    const h2 = document.querySelector('footer h2');
    const cs = getComputedStyle(h2);
    const span = [...h2.children].find((c) => !c.classList.contains('sr-only'));
    const scs = span ? getComputedStyle(span) : null;
    const chars = [...h2.querySelectorAll('span[data-pop], span[data-pop="true"]')];
    // nav row
    const navRow = document.querySelector('footer > div');
    const nav = navRow?.querySelector('nav');
    return {
      h2: {
        h: Math.round(h2.getBoundingClientRect().height),
        w: Math.round(h2.getBoundingClientRect().width),
        fs: cs.fontSize,
        lh: cs.lineHeight,
        ws: cs.whiteSpace,
        wb: cs.wordBreak,
        ta: cs.textAlign,
        cls: (typeof h2.className === 'string' ? h2.className : '').slice(0, 90),
      },
      span: span ? { h: Math.round(span.getBoundingClientRect().height), w: Math.round(span.getBoundingClientRect().width), disp: scs.display, ws: scs.whiteSpace } : null,
      chars: chars.map((c) => ({ ch: c.textContent, w: Math.round(c.getBoundingClientRect().width), top: Math.round(c.getBoundingClientRect().top) })),
      navRowH: navRow ? Math.round(navRow.getBoundingClientRect().height) : null,
      navH: nav ? Math.round(nav.getBoundingClientRect().height) : null,
      navFlexWrap: nav ? getComputedStyle(nav).flexWrap : null,
      navLinks: nav ? [...nav.querySelectorAll('a')].map((a) => Math.round(a.getBoundingClientRect().width)) : [],
    };
  });
  await ctx.close();
  return out;
}

for (const [l, u] of [['ORIGINAL', 'https://www.cravburgers.shop/'], ['CLONE', 'http://127.0.0.1:5273/']]) {
  const r = await probe(u);
  console.log(`\n===== ${l} @768 =====`);
  console.log('h2:', JSON.stringify(r.h2));
  console.log('span:', JSON.stringify(r.span));
  console.log('chars:', JSON.stringify(r.chars));
  const tops = [...new Set(r.chars.map((c) => c.top))];
  console.log('char TOP values (distinct => wrapped):', tops);
  console.log('navRowH:', r.navRowH, 'navH:', r.navH, 'wrap:', r.navFlexWrap, 'link widths:', r.navLinks);
}
await browser.close();

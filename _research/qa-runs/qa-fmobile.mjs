import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const vp = process.argv[2] === '768' ? { width: 768, height: 1024 } : { width: 390, height: 844 };

async function probe(url) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(8000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /okay|accept/i.test(x.textContent || ''));
    b?.click();
  });
  const H = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(async () => {
    await Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; })));
  });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);

  const out = await page.evaluate(() => {
    const f = document.querySelector('footer');
    return {
      footerH: Math.round(f.getBoundingClientRect().height),
      pad: getComputedStyle(f).padding,
      rows: [...f.children].map((c, i) => ({
        i,
        tag: c.tagName.toLowerCase(),
        cls: (typeof c.className === 'string' ? c.className : '').slice(0, 46),
        h: Math.round(c.getBoundingClientRect().height),
        disp: getComputedStyle(c).display,
        mt: getComputedStyle(c).marginTop,
        pt: getComputedStyle(c).paddingTop,
      })),
    };
  });
  await ctx.close();
  return out;
}

for (const [l, u] of [['ORIGINAL', 'https://www.cravburgers.shop/'], ['CLONE', 'http://127.0.0.1:5273/']]) {
  const r = await probe(u);
  console.log(`\n===== ${l} @${vp.width} ===== footerH=${r.footerH} pad=${r.pad}`);
  r.rows.forEach((x) => console.log(`  [${x.i}] ${x.tag} h=${String(x.h).padStart(4)} mt=${x.mt} pt=${x.pt} disp=${x.disp} ${x.cls}`));
}
await browser.close();


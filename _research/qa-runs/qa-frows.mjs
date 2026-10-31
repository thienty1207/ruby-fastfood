import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
async function probe(url) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(7000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /okay|accept/i.test(x.textContent || ''));
    b?.click();
  });
  const H = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 600) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(140);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1800);

  const out = await page.evaluate(() => {
    const f = document.querySelector('footer');
    // every direct child block of the footer's LAST div, with the p's inside
    const last = f.children[f.children.length - 1];
    const rows = [...last.children].map((c, i) => ({
      i,
      tag: c.tagName.toLowerCase(),
      cls: (typeof c.className === 'string' ? c.className : '').slice(0, 40),
      h: Math.round(c.getBoundingClientRect().height),
      ps: [...c.querySelectorAll('p')].map((p) => ({
        h: Math.round(p.getBoundingClientRect().height),
        cls: (typeof p.className === 'string' ? p.className : '').slice(0, 45),
        childTypes: [...p.childNodes].map((n) => (n.nodeType === 3 ? 'TEXT:' + JSON.stringify((n.nodeValue || '').slice(0, 25)) : n.nodeName.toLowerCase() + (n.nodeType === 1 ? ':' + getComputedStyle(n).display : ''))),
      })),
    }));
    return { footerH: Math.round(f.getBoundingClientRect().height), lastH: Math.round(last.getBoundingClientRect().height), rows };
  });
  await ctx.close();
  return out;
}

for (const [l, u] of [['ORIGINAL', 'https://www.cravburgers.shop/'], ['CLONE', 'http://127.0.0.1:5273/']]) {
  const r = await probe(u);
  console.log(`\n===== ${l} ===== footerH=${r.footerH} lastH=${r.lastH}`);
  for (const row of r.rows) {
    console.log(`  [${row.i}] <${row.tag}> h=${row.h} ${row.cls}`);
    for (const p of row.ps) {
      console.log(`       p h=${p.h} ${p.cls}`);
      console.log(`         nodes: ${p.childTypes.join(' | ')}`);
    }
  }
}
await browser.close();


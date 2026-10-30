import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
async function probe(url) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(7000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /okay|accept/i.test(x.textContent || ''));
    b?.click();
  });
  await page.waitForTimeout(600);
  const H = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 600) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(140);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);

  const out = await page.evaluate(() => {
    const footer = document.querySelector('footer');
    const res = { outer: footer.outerHTML.length, bottom: [] };
    // the last block in the footer
    const blocks = [...footer.children];
    blocks.forEach((b, i) => {
      const r = b.getBoundingClientRect();
      res.bottom.push({
        i,
        cls: (typeof b.className === 'string' ? b.className : '').slice(0, 60),
        h: Math.round(r.height),
        html: b.outerHTML.slice(0, 900),
      });
    });
    return res;
  });
  await ctx.close();
  return out;
}

const o = await probe('https://www.cravburgers.shop/');
const c = await probe('http://localhost:5273/');
console.log('=== ORIG ===');
o.bottom.forEach((b) => console.log(b.i, b.h, '|', b.cls, '\n   ', b.html.replace(/\s+/g, ' ').slice(0, 700)));
console.log('\n=== CLONE ===');
c.bottom.forEach((b) => console.log(b.i, b.h, '|', b.cls, '\n   ', b.html.replace(/\s+/g, ' ').slice(0, 700)));
await browser.close();

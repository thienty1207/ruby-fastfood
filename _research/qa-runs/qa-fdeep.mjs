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
  await page.waitForTimeout(500);
  const H = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 600) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(140);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);

  const out = await page.evaluate(() => {
    const f = document.querySelector('footer');
    const deep = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        cls: (typeof el.className === 'string' ? el.className : '').slice(0, 50),
        h: Math.round(r.height),
        display: cs.display,
        lh: cs.lineHeight,
        fs: cs.fontSize,
        pad: cs.padding,
        text: (el.textContent || '').trim().slice(0, 40),
        kids: [...el.children].map(deep),
      };
    };
    // the last block, full depth
    const block = f.children[f.children.length - 1];
    return deep(block);
  });
  await ctx.close();
  return out;
}

const o = await probe('https://www.cravburgers.shop/');
const c = await probe('http://127.0.0.1:5273/');

const walk = (n, d = 0) => {
  console.log(`${'  '.repeat(d)}<${n.tag}> h=${n.h} disp=${n.display} fs=${n.fs} lh=${n.lh} pad=${n.pad} «${n.text}»`);
  n.kids.forEach((k) => walk(k, d + 1));
};
console.log('=========== ORIGINAL ===========');
walk(o);
console.log('\n=========== CLONE ===========');
walk(c);
await browser.close();

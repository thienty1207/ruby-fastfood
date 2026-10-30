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
  const H = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 600) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(140);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);

  const out = await page.evaluate(() => {
    // the block that holds the mobile/desktop copyright pair
    const all = [...document.querySelectorAll('footer div')];
    const target = all.find((d) => {
      const t = d.textContent || '';
      return /Smashed patties/i.test(t) && /All rights reserved/i.test(t) && d.children.length <= 2;
    });
    if (!target) return null;
    const dump = (el, depth = 0) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        depth,
        tag: el.tagName.toLowerCase(),
        cls: (typeof el.className === 'string' ? el.className : '').slice(0, 45),
        h: Math.round(r.height),
        disp: cs.display,
        lh: cs.lineHeight,
        pad: cs.padding,
        text: (el.childElementCount === 0 ? el.textContent || '' : '').trim().slice(0, 30),
        kids: [...el.children].map((c) => dump(c, depth + 1)),
      };
    };
    return dump(target.parentElement);
  });
  await ctx.close();
  return out;
}

const walk = (n, d = 0) => {
  if (!n) return;
  console.log(`${'  '.repeat(d)}<${n.tag}> h=${n.h} disp=${n.disp} lh=${n.lh} pad=${n.pad} ${n.cls} «${n.text}»`);
  n.kids.forEach((k) => walk(k, d + 1));
};

console.log('=== ORIGINAL ===');
walk(await probe('https://www.cravburgers.shop/'));
console.log('\n=== CLONE ===');
walk(await probe('http://127.0.0.1:5273/'));
await browser.close();

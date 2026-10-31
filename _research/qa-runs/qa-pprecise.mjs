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
    const ps = [...document.querySelectorAll('footer p')];
    const p = ps.find((x) => /All rights reserved/i.test(x.textContent || ''));
    if (!p) return null;
    const r = p.getBoundingClientRect();
    const cs = getComputedStyle(p);
    // node-level breakdown
    const nodes = [...p.childNodes].map((n) => ({
      type: n.nodeType === 3 ? 'text' : n.nodeName.toLowerCase(),
      value: n.nodeType === 3 ? JSON.stringify(n.nodeValue) : undefined,
      disp: n.nodeType === 1 ? getComputedStyle(n).display : undefined,
      h: n.nodeType === 1 ? Math.round(n.getBoundingClientRect().height) : undefined,
    }));
    return {
      pHeight: Math.round(r.height),
      lineHeight: cs.lineHeight,
      fontSize: cs.fontSize,
      display: cs.display,
      parentH: Math.round(p.parentElement.getBoundingClientRect().height),
      parentPad: getComputedStyle(p.parentElement).padding,
      nodes,
      innerHTML: p.innerHTML.replace(/\s+/g, ' ').slice(0, 420),
    };
  });
  await ctx.close();
  return out;
}

for (const [l, u] of [['ORIGINAL', 'https://www.cravburgers.shop/'], ['CLONE', 'http://127.0.0.1:5273/']]) {
  const r = await probe(u);
  console.log(`\n===== ${l} =====`);
  console.log(JSON.stringify(r, null, 2));
}
await browser.close();

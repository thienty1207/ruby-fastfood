// FROM-LOAD capture: sample every 60ms starting at domcontentloaded.
// This is the fair test — the original gates its intro on a page loader, so a
// "wait 6s then look" probe sees the clone already settled and the original
// still moving. Sampling from t=0 catches both.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

async function fromLoad(url) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

  const read = () =>
    page.evaluate(() => {
      const t = (el) => {
        if (!el) return null;
        const v = getComputedStyle(el).transform;
        const m = v.match(/matrix\(([^)]+)\)/);
        if (!m) return null;
        const n = m[1].split(',').map(Number);
        return { ty: Math.round(n[5] * 10) / 10, s: Math.round(n[0] * 1000) / 1000, op: Math.round(parseFloat(getComputedStyle(el).opacity) * 100) / 100 };
      };
      return {
        t: Math.round(performance.now()),
        h1: t(document.querySelector('#hero h1 span[data-pop], #hero h1 span[data-pop="true"]')),
        para: t(document.querySelector('#hero .line, #hero [data-lines] .line')),
        burger: t(document.querySelector('#hero .opacity-0, #hero [data-hero-burger]')),
      };
    });

  const series = [];
  // sample for 4 seconds from load
  for (let i = 0; i < 66; i++) {
    try {
      series.push(await read());
    } catch {
      /* mid-navigation */
    }
    await page.waitForTimeout(60);
  }
  await ctx.close();
  return series;
}

const uniq = (arr, pick) => {
  const out = [];
  for (const s of arr) {
    const v = s[pick];
    if (!v) continue;
    const key = `${v.ty}|${v.s}|${v.op}`;
    if (!out.length || out[out.length - 1] !== key) out.push(key);
  }
  return [...new Set(out)];
};

for (const [label, url] of [['ORIGINAL', 'https://www.cravburgers.shop/'], ['CLONE', 'http://127.0.0.1:5273/']]) {
  const s = await fromLoad(url);
  const h1 = uniq(s, 'h1');
  const para = uniq(s, 'para');
  const burger = uniq(s, 'burger');
  console.log(`\n===== ${label} (t from load) =====`);
  console.log(`hero H1 word  : ${h1.length} distinct frames`);
  console.log(`   ${h1.slice(0, 8).join('\n   ')}`);
  console.log(`hero paragraph: ${para.length} distinct frames`);
  console.log(`   ${para.slice(0, 4).join('  ')}`);
  console.log(`hero burger   : ${burger.length} distinct frames`);
  console.log(`   ${burger.slice(0, 5).join('  ')}`);
}

await browser.close();

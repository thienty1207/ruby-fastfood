// Walk the ancestor chain of the broken headline and report anything that
// clips (overflow hidden/clip) or constrains height.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
await page.evaluate(() => document.querySelector('#menu')?.scrollIntoView({ block: 'start' }));
await page.waitForTimeout(2500);

const chain = await page.evaluate(() => {
  const el = document.querySelector('#menu [data-rk-headline]');
  const out = [];
  let n = el;
  while (n && n !== document.documentElement) {
    const s = getComputedStyle(n);
    const r = n.getBoundingClientRect();
    out.push({
      tag: n.tagName.toLowerCase(),
      cls: (typeof n.className === 'string' ? n.className : '').slice(0, 46),
      h: Math.round(r.height),
      overflow: s.overflow,
      overflowY: s.overflowY,
      display: s.display,
      height: s.height,
      maxHeight: s.maxHeight,
      contain: s.contain,
      clipPath: s.clipPath === 'none' ? 'none' : 'CLIP!',
      lineHeight: s.lineHeight,
      fontSize: s.fontSize,
    });
    n = n.parentElement;
  }
  const word = document.querySelector('#menu [data-rk-headline] [data-pop]');
  const wr = word?.getBoundingClientRect();
  return {
    chain: out,
    word: word ? { h: Math.round(wr.height), top: Math.round(wr.top), bottom: Math.round(wr.bottom) } : null,
  };
});

console.log('word box:', JSON.stringify(chain.word));
console.log('\nancestor chain (only rows that could clip):');
for (const c of chain.chain) {
  const flags = [];
  if (c.overflow !== 'visible' || c.overflowY !== 'visible') flags.push('OVERFLOW');
  if (c.clipPath !== 'none') flags.push('CLIP-PATH');
  if (c.contain !== 'none') flags.push('CONTAIN');
  if (c.maxHeight !== 'none') flags.push('MAXH');
  console.log(
    `  ${c.tag.padEnd(6)} h=${String(c.h).padStart(5)} lh=${c.lineHeight.padEnd(7)} ov=${c.overflowY.padEnd(7)} ${c.cls.padEnd(46)} ${flags.join(' ')}`,
  );
}
await browser.close();

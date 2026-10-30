// Capture the PRE-reveal state of line-mask / data-pop elements (before their triggers fire).
import { chromium } from 'playwright';
import fs from 'node:fs';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('https://www.cravburgers.shop/', { waitUntil: 'domcontentloaded', timeout: 90000 });
// wait only for fonts+first paint, DO NOT scroll (so below-fold triggers haven't fired)
await page.waitForTimeout(7000);

const pre = await page.evaluate(() => {
  const cs = (el, props) => {
    const s = getComputedStyle(el);
    return Object.fromEntries(props.map((p) => [p, s[p]]));
  };
  const line = document.querySelector('#cta .line, .line');
  const mask = document.querySelector('.line-mask');
  const pop = document.querySelector('[data-pop]');
  const heroImgWrap = document.querySelector('#hero .opacity-0');
  return {
    lineExists: !!line,
    line: line ? cs(line, ['transform', 'opacity', 'willChange']) : null,
    lineInline: line?.getAttribute('style'),
    mask: mask ? cs(mask, ['overflow', 'position', 'display']) : null,
    maskHtml: mask?.outerHTML?.slice(0, 400),
    pop: pop ? cs(pop, ['transform', 'opacity', 'transformOrigin']) : null,
    popHtml: pop?.outerHTML?.slice(0, 300),
    heroImgWrap: heroImgWrap ? cs(heroImgWrap, ['opacity', 'transform']) : null,
  };
});
console.log(JSON.stringify(pre, null, 2));
await browser.close();

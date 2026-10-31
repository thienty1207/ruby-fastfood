// Diagnose the broken headline: capture computed styles of the split words.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);

// scroll so the menu headline reveals
await page.evaluate(() => document.querySelector('#menu')?.scrollIntoView({ block: 'start' }));
await page.waitForTimeout(3000);

const info = await page.evaluate(() => {
  const h = document.querySelector('#menu [data-rk-headline]');
  if (!h) return { error: 'no headline' };
  const cs = getComputedStyle(h);
  const words = [...h.querySelectorAll('[data-pop], span')].slice(0, 8).map((w) => {
    const s = getComputedStyle(w);
    const r = w.getBoundingClientRect();
    return {
      text: w.textContent?.slice(0, 14),
      cls: w.className,
      display: s.display,
      opacity: s.opacity,
      transform: s.transform,
      fontSize: s.fontSize,
      overflow: s.overflow,
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  });
  return {
    text: h.textContent,
    html: h.innerHTML.slice(0, 400),
    fontSize: cs.fontSize,
    lineHeight: cs.lineHeight,
    overflow: cs.overflow,
    height: Math.round(h.getBoundingClientRect().height),
    words,
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'qa-rk-full/label-broken.png' });
await browser.close();

// Bisect: render the menu headline (a) with reduced-motion (no GSAP), and
// (b) normally. Compare word boxes to find whether the break is CSS or motion.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

async function shoot(tag, reducedMotion) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion, // 'reduce' | 'no-preference'
  });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  await page.evaluate(() => document.querySelector('#menu')?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(2500);

  const data = await page.evaluate(() => {
    const h = document.querySelector('#menu [data-rk-headline]');
    const words = [...h.querySelectorAll('[data-pop]')].map((w) => {
      const r = w.getBoundingClientRect();
      const s = getComputedStyle(w);
      return {
        t: w.textContent,
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        transform: s.transform,
        opacity: s.opacity,
        fontSize: s.fontSize,
        overflow: s.overflow,
      };
    });
    return { words, h2h: Math.round(h.getBoundingClientRect().height) };
  });

  console.log(`\n[${tag}] h2 height=${data.h2h}`);
  for (const w of data.words) {
    console.log(
      `   "${w.t}" x=${w.x} y=${w.y} ${w.w}x${w.h} op=${w.opacity} tf=${w.transform.slice(0, 30)} ov=${w.overflow}`,
    );
  }
  await page.screenshot({ path: `qa-rk-full2/bisect-${tag}.png` });
  await ctx.close();
}

await shoot('reduced', 'reduce');
await shoot('motion', 'no-preference');
await browser.close();

// Verify will-change is only promoted while the section is on screen.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);

const at = async (y) => {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(800);
  return page.evaluate(() => {
    const s = document.querySelector('[data-rk-sig]');
    const shell = document.querySelector('[data-rk-sig-shell]');
    const media = document.querySelector('[data-rk-sig-media-inner]');
    return {
      y: Math.round(window.scrollY),
      isAnimating: s.classList.contains('is-animating'),
      shellWillChange: getComputedStyle(shell).willChange,
      mediaWillChange: getComputedStyle(media).willChange,
    };
  });
};

console.log('at top    :', JSON.stringify(await at(0)));
console.log('in section:', JSON.stringify(await at(1200)));
console.log('at footer :', JSON.stringify(await at(4500)));
await browser.close();

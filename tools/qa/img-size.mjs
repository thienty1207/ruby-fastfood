// Measure rendered card image + pin image sizes at each viewport.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

for (const w of [1920, 1440, 1024, 768, 375]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // scroll to the signature section so lazy images are laid out
  await page.evaluate(() => {
    const s = document.querySelector('#menu');
    window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY - 100);
  });
  await page.waitForTimeout(1500);

  const sig = await page.evaluate(() => {
    const card = document.querySelector('.rk-sig-card');
    const media = card.querySelector('.rk-sig__media');
    const img = card.querySelector('.rk-sig__img');
    const r = media.getBoundingClientRect();
    return {
      mediaBox: `${Math.round(r.width)}x${Math.round(r.height)}`,
      ratio: (r.width / r.height).toFixed(3),
      imgNatural: img ? `${img.naturalWidth}x${img.naturalHeight}` : 'n/a',
      imgRendered: img ? `${Math.round(img.getBoundingClientRect().width)}x${Math.round(img.getBoundingClientRect().height)}` : 'n/a',
    };
  });

  // pin thumb in the journey section
  await page.evaluate(() => {
    const s = document.querySelector('[data-rk-jr]');
    window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 400);
  });
  await page.waitForTimeout(1200);

  const pin = await page.evaluate(() => {
    const t = document.querySelector('.rk-jr__thumb');
    const img = t?.querySelector('img');
    if (!t) return null;
    const r = t.getBoundingClientRect();
    return {
      thumbBox: `${Math.round(r.width)}x${Math.round(r.height)}`,
      ratio: (r.width / r.height).toFixed(3),
      imgRendered: img ? `${Math.round(img.getBoundingClientRect().width)}x${Math.round(img.getBoundingClientRect().height)}` : 'n/a',
    };
  });

  console.log(`\n=== ${w}px ===`);
  console.log(`  signature card media : ${sig.mediaBox}  (ratio ${sig.ratio})`);
  console.log(`  signature card img   : natural ${sig.imgNatural} -> rendered ${sig.imgRendered}`);
  if (pin) {
    console.log(`  journey pin thumb    : ${pin.thumbBox}  (ratio ${pin.ratio})`);
    console.log(`  journey pin img      : rendered ${pin.imgRendered}`);
  }
  await ctx.close();
}
await browser.close();

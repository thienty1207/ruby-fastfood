// Verify the new photo-above-text layout at 375 and 768.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-layout');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const w of [768, 375]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3200);

  const secTop = await page.evaluate(() => {
    const s = document.querySelector('#menu');
    return Math.round(s.getBoundingClientRect().top + window.scrollY);
  });
  await page.evaluate((yy) => window.scrollTo(0, yy), secTop + 300);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(OUT, `${w}-card.png`) });

  const info = await page.evaluate(() => {
    const card = document.querySelector('.rk-sig-card');
    const media = card.querySelector('.rk-sig__media');
    const body = card.querySelector('.rk-sig-card__body');
    const meta = card.querySelector('.rk-sig-card__meta');
    const name = card.querySelector('.rk-sig-card__name');
    const mr = media.getBoundingClientRect();
    const br = body.getBoundingClientRect();
    const nmr = name.getBoundingClientRect();
    return {
      mediaBottom: Math.round(mr.bottom),
      nameTop: Math.round(nmr.top),
      // media must END above where the name STARTS (no overlay)
      noOverlay: mr.bottom <= nmr.top + 2,
      bodyBelow: br.top >= mr.bottom - 2,
      metaCols: getComputedStyle(meta).gridTemplateColumns,
      ovX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  console.log(`${w}: mediaBottom=${info.mediaBottom} nameTop=${info.nameTop} noOverlay=${info.noOverlay} bodyBelow=${info.bodyBelow} ovX=${info.ovX}`);
  console.log(`     meta cols: ${info.metaCols}`);
  console.log(`     errors: ${errs.length ? errs[0] : 'none'}`);
  await ctx.close();
}
await browser.close();

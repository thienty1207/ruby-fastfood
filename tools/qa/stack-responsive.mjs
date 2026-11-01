// Verify mobile flow layout, reduced motion, and the release into the next section.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-stack');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

// ── mobile: no pin, all four visible, no overflow ────────────────────
for (const w of [375, 768]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 812 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3200);

  const info = await page.evaluate(() => {
    const sec = document.querySelector('[data-rk-sig]');
    const pinned = sec.parentElement?.classList.contains('pin-spacer') || false;
    const layers = [...document.querySelectorAll('[data-rk-sig-layer]')];
    const rows = [...document.querySelectorAll('[data-rk-sig-info-row]')];
    return {
      pinned,
      layerPositions: layers.map((l) => getComputedStyle(l).position),
      layerHeights: layers.map((l) => Math.round(l.getBoundingClientRect().height)),
      visibleRows: rows.filter((r) => getComputedStyle(r).visibility === 'visible').length,
      totalRows: rows.length,
      ovX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      docH: document.body.scrollHeight,
    };
  });
  console.log(`${w}px: pinned=${info.pinned} layers=${info.layerPositions.join(',')} heights=[${info.layerHeights.join(',')}] rows=${info.visibleRows}/${info.totalRows} ovX=${info.ovX}`);
  console.log(`       errors: ${errs.length ? errs[0] : 'none'}`);

  // screenshot the section
  await page.evaluate(() => {
    const s = document.querySelector('[data-rk-sig]');
    window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY - 60);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, `mob-${w}.png`) });
  await ctx.close();
}

// ── reduced motion: no pin, everything readable ──────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const sec = document.querySelector('[data-rk-sig]');
    return {
      pinned: sec.parentElement?.classList.contains('pin-spacer') || false,
      layerPositions: [...document.querySelectorAll('[data-rk-sig-layer]')].map(
        (l) => getComputedStyle(l).position,
      ),
      visibleRows: [...document.querySelectorAll('[data-rk-sig-info-row]')].filter(
        (x) => getComputedStyle(x).visibility === 'visible',
      ).length,
      docH: document.body.scrollHeight,
    };
  });
  console.log(`\nREDUCED MOTION: pinned=${r.pinned} layers=${r.layerPositions.join(',')} rows=${r.visibleRows} docH=${r.docH}`);
  await ctx.close();
}

// ── release: after the pin the next section must follow immediately ──
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  const geo = await page.evaluate(() => {
    const sec = document.querySelector('[data-rk-sig]');
    const spacer = sec.parentElement;
    const next = document.querySelector('[data-rk-jr]');
    return {
      spacerBottom: Math.round(spacer.getBoundingClientRect().bottom + window.scrollY),
      nextTop: next ? Math.round(next.getBoundingClientRect().top + window.scrollY) : null,
      nextTag: next ? next.className : 'none',
    };
  });
  console.log(`\nRELEASE: spacer bottom=${geo.spacerBottom} next section top=${geo.nextTop} (${geo.nextTag})`);
  console.log(`  gap = ${geo.nextTop !== null ? geo.nextTop - geo.spacerBottom : 'n/a'}px`);

  // scroll just past the pin and screenshot
  await page.evaluate((y) => window.scrollTo(0, y), geo.spacerBottom - 200);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'release.png') });
  await ctx.close();
}
await browser.close();

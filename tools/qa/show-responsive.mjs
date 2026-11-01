// Mobile + reduced motion + release for the redesigned showcase.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-show');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

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
    const chapters = [...document.querySelectorAll('[data-rk-sig-chapter]')];
    const panels = [...document.querySelectorAll('[data-rk-sig-panel]')];
    return {
      pinned,
      chapterVis: chapters.filter((c) => Number(getComputedStyle(c).opacity) > 0.9).length,
      chapterTotal: chapters.length,
      panelPos: panels.map((p) => getComputedStyle(p).position),
      panelH: panels.map((p) => Math.round(p.getBoundingClientRect().height)),
      panelOpacity: panels.map((p) => Number(getComputedStyle(p).opacity).toFixed(2)),
      ovX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      docH: document.body.scrollHeight,
    };
  });
  console.log(`${w}: pinned=${info.pinned} chaptersVisible=${info.chapterVis}/${info.chapterTotal}`);
  console.log(`     panelPos=${info.panelPos.join(',')} heights=[${info.panelH.join(',')}] opacity=[${info.panelOpacity.join(',')}]`);
  console.log(`     ovX=${info.ovX} docH=${info.docH} errors=${errs.length ? errs[0] : 'none'}`);

  await page.evaluate(() => {
    const s = document.querySelector('[data-rk-sig]');
    window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY - 50);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, `mob-${w}.png`) });
  await ctx.close();
}

// reduced motion
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const sec = document.querySelector('[data-rk-sig]');
    const chapters = [...document.querySelectorAll('[data-rk-sig-chapter]')];
    const panels = [...document.querySelectorAll('[data-rk-sig-panel]')];
    return {
      pinned: sec.parentElement?.classList.contains('pin-spacer') || false,
      chaptersVisible: chapters.filter((c) => Number(getComputedStyle(c).opacity) > 0.9).length,
      panelPos: panels.map((p) => getComputedStyle(p).position),
      docH: document.body.scrollHeight,
    };
  });
  console.log(`\nREDUCED MOTION: pinned=${r.pinned} chapters=${r.chaptersVisible}/4 panels=${r.panelPos.join(',')} docH=${r.docH}`);
  await ctx.close();
}

// release: next section must follow with no gap
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  const g = await page.evaluate(() => {
    const sec = document.querySelector('[data-rk-sig]');
    const spacer = sec.parentElement;
    const next = document.querySelector('[data-rk-jr]');
    return {
      spacerBottom: Math.round(spacer.getBoundingClientRect().bottom + window.scrollY),
      nextTop: next ? Math.round(next.getBoundingClientRect().top + window.scrollY) : null,
      nextName: next ? 'rk-jr' : 'none',
    };
  });
  console.log(`\nRELEASE: spacerBottom=${g.spacerBottom} nextTop=${g.nextTop} (${g.nextName}) gap=${g.nextTop - g.spacerBottom}px`);
  await ctx.close();
}
await browser.close();

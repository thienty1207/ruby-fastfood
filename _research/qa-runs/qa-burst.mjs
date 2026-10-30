// MID-ANIMATION proof: sample every 80ms right at the trigger, on both sites.
// A settled sample (y=0) can't distinguish "animated" from "never animated",
// so this catches the motion while it is actually happening.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.cwd();
fs.mkdirSync(path.join(OUT, 'qa-anim'), { recursive: true });
const browser = await chromium.launch({ headless: true });

async function burst(url) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(6000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /okay|accept/i.test(x.textContent || ''));
    b?.click();
  });
  await page.waitForTimeout(600);

  const read = () =>
    page.evaluate(() => {
      const t = (el) => {
        if (!el) return null;
        const v = getComputedStyle(el).transform;
        const m = v.match(/matrix\(([^)]+)\)/);
        if (!m) return null;
        const n = m[1].split(',').map(Number);
        return { ty: Math.round(n[5] * 100) / 100, s: Math.round(n[0] * 1000) / 1000, op: getComputedStyle(el).opacity };
      };
      return {
        heroH1word: t(document.querySelector('#hero h1 span[data-pop], #hero h1 span[data-pop="true"]')),
        aboutH2word: t(document.querySelector('#about h2 span[data-pop], #about h2 span[data-pop="true"]')),
        heroParaLine: t(document.querySelector('#hero .line, #hero [data-lines] .line')),
        ctaStickerPeel: (() => {
          const c = document.querySelector('#cta .sticker-container') || document.querySelector('.sticker-container');
          return c ? (c.style.getPropertyValue('--peel-amount') || null) : null;
        })(),
      };
    });

  // jump to just BEFORE the hero H1 trigger, then sample the burst
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const heroSeries = [];
  for (let i = 0; i < 22; i++) {
    heroSeries.push(await read());
    await page.waitForTimeout(80);
  }

  // about H2: scroll so its trigger fires, sample immediately
  const aboutTop = await page.evaluate(() => document.querySelector('#about h2')?.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 700)), aboutTop);
  const aboutSeries = [];
  for (let i = 0; i < 22; i++) {
    aboutSeries.push(await read());
    await page.waitForTimeout(80);
  }

  // CTA sticker peel across a scroll sweep
  const peelSeries = [];
  const ctaTop = await page.evaluate(() => document.querySelector('#cta .sticker-container, .sticker-container')?.getBoundingClientRect().top + window.scrollY);
  for (let y = Math.max(0, ctaTop - 1600); y < ctaTop + 600; y += 120) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(220);
    peelSeries.push(await read());
  }

  await ctx.close();
  return { heroSeries, aboutSeries, peelSeries };
}

const uniq = (arr, pick) => [...new Set(arr.map(pick).map((v) => (v === null ? 'null' : JSON.stringify(v))))];

for (const [label, url] of [['orig', 'https://www.cravburgers.shop/'], ['clone', 'http://127.0.0.1:5273/']]) {
  const r = await burst(url);
  console.log(`\n===== ${label.toUpperCase()} =====`);
  console.log('hero H1 word — distinct (ty,scale,opacity) states:', uniq(r.heroSeries, (s) => s.heroH1word).length);
  console.log('   ', uniq(r.heroSeries, (s) => s.heroH1word).slice(0, 6).join('  '));
  console.log('about H2 word — distinct states:', uniq(r.aboutSeries, (s) => s.aboutH2word).length);
  console.log('   ', uniq(r.aboutSeries, (s) => s.aboutH2word).slice(0, 6).join('  '));
  console.log('hero paragraph line — distinct states:', uniq(r.heroSeries, (s) => s.heroParaLine).length);
  console.log('   ', uniq(r.heroSeries, (s) => s.heroParaLine).slice(0, 5).join('  '));
  const peels = uniq(r.peelSeries, (s) => s.ctaStickerPeel);
  console.log('sticker peel — distinct values:', peels.length, peels.slice(0, 10).join(' '));
}

await browser.close();

// Post-migration visual comparison: screenshots + CSS/font verification.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-migrate');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
page.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url().split('/').pop()));

await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);

const H = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < H; y += 700) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(260);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(2500);

const check = await page.evaluate(() => {
  const cs = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    return { fs: s.fontSize, stroke: s.webkitTextStroke, color: s.color, font: s.fontFamily.slice(0, 24) };
  };
  return {
    h1: cs('#hero h1'),
    cssLoaded: [...document.styleSheets].length,
    cssRules: (() => { try { return [...document.styleSheets].reduce((a, s) => a + s.cssRules.length, 0); } catch { return 'CORS'; } })(),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    red: getComputedStyle(document.documentElement).getPropertyValue('--red').trim(),
    fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
    broken: [...document.images].filter((i) => i.naturalWidth === 0).map((i) => i.src.split('/').pop()),
    sections: [...document.querySelectorAll('section, footer')].map((s) => (s.id || s.tagName.toLowerCase()) + ':' + Math.round(s.getBoundingClientRect().height)),
    stickers: document.querySelectorAll('[data-sticker]').length,
  };
});
console.log(JSON.stringify(check, null, 2));
console.log('console errors:', errs.length ? errs.slice(0, 8).join(' | ') : 'NONE');

const picks = [['01-hero', 0], ['02-about', 1250], ['03-experience', 3300], ['05-map', 6300], ['07-cta', 8900], ['08-footer', 9700]];
for (const [name, y] of picks) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}
console.log('screenshots written');
await browser.close();

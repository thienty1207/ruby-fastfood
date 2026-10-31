// Verify the bun-served build renders and animates identically.
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:5299/';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
page.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url().split('/').pop()));

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

// sample the intro from t=0
const read = () =>
  page.evaluate(() => {
    const t = (el) => {
      if (!el) return null;
      const m = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/);
      if (!m) return null;
      const n = m[1].split(',').map(Number);
      return { ty: Math.round(n[5] * 10) / 10, s: Math.round(n[0] * 1000) / 1000 };
    };
    return {
      burger: t(document.querySelector('[data-hero-burger]')),
      word: t(document.querySelector('#hero [data-pop]')),
    };
  });

const frames = [];
for (let i = 0; i < 40; i++) {
  try { frames.push(await read()); } catch {}
  await page.waitForTimeout(70);
}
const uniq = (pick) => {
  const out = [];
  for (const f of frames) {
    const v = f[pick];
    if (!v) continue;
    const k = `${v.ty}|${v.s}`;
    if (out[out.length - 1] !== k) out.push(k);
  }
  return [...new Set(out)];
};
console.log('hero burger frames:', uniq('burger').length, uniq('burger').slice(0, 5).join('  '));
console.log('hero word frames  :', uniq('word').length, uniq('word').slice(0, 5).join('  '));

await page.waitForTimeout(3000);
const H = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < H; y += 600) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(120);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(2000);

const state = await page.evaluate(() => ({
  docH: document.body.scrollHeight,
  sections: [...document.querySelectorAll('section, footer')].map((s) => (s.id || s.tagName.toLowerCase()) + ':' + Math.round(s.getBoundingClientRect().height)),
  fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
  styleLen: [...document.querySelectorAll('style,link[rel=stylesheet]')].reduce((a, n) => a + (n.href ? 1 : (n.textContent || '').length), 0),
  stickers: document.querySelectorAll('[data-sticker]').length,
  brokenImgs: [...document.images].filter((i) => i.naturalWidth === 0).map((i) => i.src.split('/').pop()),
  lenis: document.documentElement.classList.contains('lenis'),
}));
console.log('docH:', state.docH);
console.log('sections:', state.sections.join(' '));
console.log('fonts:', state.fonts.join(', '));
console.log('style bytes:', state.styleLen, '| stickers:', state.stickers, '| lenis:', state.lenis);
if (state.brokenImgs.length) console.log('BROKEN IMAGES:', state.brokenImgs.join(', '));
console.log('errors:', errs.length ? errs.slice(0, 6).join(' | ') : 'none');
await browser.close();

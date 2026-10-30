// SIDE-BY-SIDE animation proof: same probe on original and clone, same scroll
// positions, diff the measured motion. This is the real test — not screenshots.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.cwd();
const SHOTS = path.join(OUT, 'qa-anim');
fs.mkdirSync(SHOTS, { recursive: true });

const SITES = {
  orig: 'https://www.cravburgers.shop/',
  clone: 'http://127.0.0.1:5273/',
};

const browser = await chromium.launch({ headless: true });

// probe that works on BOTH (original has no data-* attrs, so use real selectors)
const PROBE = () => {
  const cs = (sel, props) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    return Object.fromEntries(props.map((p) => [p, s[p]]));
  };
  const num = (v) => {
    if (!v || v === 'none') return null;
    const m = v.match(/matrix\(([^)]+)\)/);
    if (!m) return null;
    const n = m[1].split(',').map(Number);
    return { tx: Math.round(n[4] * 10) / 10, ty: Math.round(n[5] * 10) / 10, a: Math.round(n[0] * 1000) / 1000 };
  };
  return {
    scrollY: Math.round(window.scrollY),
    // hero burger wrapper
    heroBurger: num(cs('#hero .opacity-0', ['transform'])?.transform ?? cs('#hero [data-hero-burger]', ['transform'])?.transform),
    // hero H1 first animated word
    heroWord: num(cs('#hero h1 [data-pop], #hero h1 span[data-pop="true"]', ['transform'])?.transform),
    // first paragraph line inside the mask
    heroLine: num(cs('#hero .line, #hero [data-lines] .line', ['transform'])?.transform),
    // about H2 word
    aboutWord: num(cs('#about h2 [data-pop], #about [data-split] [data-pop="true"]', ['transform'])?.transform),
    // ingredient parallax
    veg: num(cs('#ingredients > div > div[style*="translateY"], #ingredients [data-veg]', ['transform'])?.transform),
    // map plane
    plane: num(cs('#map-desktop > div[style*="translate3d"], #map-desktop [data-map-plane]', ['transform'])?.transform),
    // map pin 0 opacity+transform
    pin0: cs('#map-desktop .absolute.right-\\[5vw\\], #map-desktop [data-pin="0"]', ['opacity', 'transform']),
    // sticker peel variable
    peel: (() => {
      const c = document.querySelector('.sticker-container');
      if (!c) return null;
      return c.style.getPropertyValue('--peel-amount') || getComputedStyle(c).getPropertyValue('--peel-amount').trim();
    })(),
    // jelly divider path (first 40 chars of d)
    jelly: document.querySelector('.jelly path')?.getAttribute('d')?.slice(0, 44) ?? null,
    // footer juggle item (translate3d x/y tells if it's mid-flight)
    juggle: num(cs('footer img[style*="will-change: transform, opacity"]', ['transform'])?.transform),
    // eye pupil rotation
    eye: num(cs('#hero [data-eye], #hero .bg-white div[style*="rotate"], [data-eye="left"]', ['transform'])?.transform),
  };
};

async function run(url, label) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(7000);
  // dismiss cookie banner on original
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /okay|accept/i.test(x.textContent || ''));
    b?.click();
  });
  await page.waitForTimeout(800);

  const out = [];
  for (const y of [0, 600, 1200, 3000, 4800, 6100, 7200, 8300, 9500, 10200]) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(1500);
    out.push(await page.evaluate(PROBE));
  }

  // eye + cursor interaction tests
  await page.evaluate(() => window.scrollTo(0, 2800));
  await page.waitForTimeout(1400);
  await page.mouse.move(250, 450);
  await page.waitForTimeout(600);
  const eyeLeft = await page.evaluate(PROBE);
  await page.mouse.move(1250, 450);
  await page.waitForTimeout(600);
  const eyeRight = await page.evaluate(PROBE);

  await ctx.close();
  return { out, errs, eyeLeft: eyeLeft.eye, eyeRight: eyeRight.eye };
}

const result = {};
for (const [k, u] of Object.entries(SITES)) {
  console.log('probing', k, '...');
  result[k] = await run(u, k);
}

// ---- compare ----
console.log('\n===== MOTION COMPARISON (orig vs clone) =====');
const ys = result.orig.out.map((s) => s.scrollY);
const fmt = (n) => (n === null || n === undefined ? '  -  ' : String(n).padStart(7));
const fmtV = (v) => (v === null ? '  -  ' : `${fmt(v.ty)}`);

console.log('scrollY | heroBurger.ty | heroWord.ty | aboutWord.ty | veg.ty | plane.tx,ty | pin0.op | peel | juggle.ty');
for (let i = 0; i < result.orig.out.length; i++) {
  const o = result.orig.out[i];
  const c = result.clone.out[i];
  console.log(
    `${String(o.scrollY).padStart(6)} | ` +
      `${fmtV(o.heroBurger)} ${fmtV(c.heroBurger)} | ` +
      `${fmtV(o.heroWord)} ${fmtV(c.heroWord)} | ` +
      `${fmtV(o.aboutWord)} ${fmtV(c.aboutWord)} | ` +
      `${fmtV(o.veg)} ${fmtV(c.veg)} | ` +
      `${o.plane ? o.plane.tx + ',' + o.plane.ty : '-'} / ${c.plane ? c.plane.tx + ',' + c.plane.ty : '-'} | ` +
      `${o.pin0?.opacity ?? '-'}/${c.pin0?.opacity ?? '-'} | ` +
      `${o.peel ?? '-'}/${c.peel ?? '-'} | ` +
      `${fmtV(o.juggle)} ${fmtV(c.juggle)}`,
  );
}

// motion-range test: does each target actually CHANGE across scroll?
const rangeOf = (arr, pick) => {
  const vals = arr.map(pick).filter((v) => v !== null && v !== undefined && typeof v === 'number');
  if (vals.length < 2) return { range: 0, n: vals.length };
  return { range: Math.round((Math.max(...vals) - Math.min(...vals)) * 10) / 10, n: vals.length };
};
console.log('\n===== DOES IT MOVE ACROSS SCROLL? (range = max-min) =====');
const tests = [
  ['heroBurger.ty', (s) => s.heroBurger?.ty],
  ['heroWord.ty', (s) => s.heroWord?.ty],
  ['aboutWord.ty', (s) => s.aboutWord?.ty],
  ['veg.ty', (s) => s.veg?.ty],
  ['plane.tx', (s) => s.plane?.tx],
  ['plane.ty', (s) => s.plane?.ty],
  ['juggle.ty', (s) => s.juggle?.ty],
];
for (const [name, pick] of tests) {
  const ro = rangeOf(result.orig.out, pick);
  const rc = rangeOf(result.clone.out, pick);
  const ok = rc.range > 1 && Math.abs(rc.range - ro.range) / Math.max(ro.range, 1) < 0.35;
  console.log(`${name.padEnd(15)} orig=${String(ro.range).padStart(8)}px  clone=${String(rc.range).padStart(8)}px  ${ok ? 'MATCH' : rc.range > 1 ? 'DIFFERS' : 'STATIC!!'}`);
}

const peelValsO = result.orig.out.map((s) => parseFloat(s.peel)).filter((v) => !isNaN(v));
const peelValsC = result.clone.out.map((s) => parseFloat(s.peel)).filter((v) => !isNaN(v));
const peelRange = (v) => (v.length ? Math.round((Math.max(...v) - Math.min(...v)) * 100) / 100 : 0);
console.log(`${'peel-amount'.padEnd(15)} orig=${peelRange(peelValsO)}  clone=${peelRange(peelValsC)}`);

const jellySame = new Set(result.clone.out.map((s) => s.jelly)).size;
const jellySameO = new Set(result.orig.out.map((s) => s.jelly)).size;
console.log(`${'jelly path'.padEnd(15)} orig distinct=${jellySameO}  clone distinct=${jellySame}`);

console.log(`\neye tracking  orig: ${result.orig.eyeLeft?.a} -> ${result.orig.eyeRight?.a}  changed=${result.orig.eyeLeft?.a !== result.orig.eyeRight?.a}`);
console.log(`eye tracking clone: ${result.clone.eyeLeft?.a} -> ${result.clone.eyeRight?.a}  changed=${result.clone.eyeLeft?.a !== result.clone.eyeRight?.a}`);

console.log('\nclone errors:', result.clone.errs.length ? result.clone.errs.slice(0, 5).join(' | ') : 'none');

fs.writeFileSync(path.join(SHOTS, 'motion-compare.json'), JSON.stringify(result, null, 2));
await browser.close();

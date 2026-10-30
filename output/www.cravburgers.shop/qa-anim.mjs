// Runtime animation verification: does the clone actually MOVE?
// Measures real GSAP state + before/after values as scroll advances.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.cwd();
const CLONE = 'http://localhost:5273/';
const SHOTS = path.join(OUT, 'qa-anim');
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });

await page.goto(CLONE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);

// ---- 1. is GSAP alive and are there tweens/triggers? ----
const lib = await page.evaluate(() => {
  const g = window.gsap;
  return {
    gsapPresent: !!g,
    version: g?.version,
    globalTimelineChildren: g?.globalTimeline?.getChildren?.(true, true, true)?.length ?? null,
    lenis: !!document.querySelector('html.lenis'),
    scrollTriggerCount: window.ScrollTrigger?.getAll?.().length ?? null,
    htmlClass: document.documentElement.className,
  };
});
console.log('LIB:', JSON.stringify(lib));

// ---- 2. sample animated things at several scroll positions ----
const samples = [];
const H = await page.evaluate(() => document.body.scrollHeight);

const grab = () =>
  page.evaluate(() => {
    const pick = (sel, props = ['transform', 'opacity']) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return Object.fromEntries(props.map((p) => [p, cs[p]]));
    };
    return {
      scrollY: Math.round(window.scrollY),
      heroBurger: pick('[data-hero-burger]'),
      heroWord: pick('#hero [data-pop]'),
      aboutWord: pick('#about [data-split] [data-pop]'),
      stickyPeel: (() => {
        const c = document.querySelector('[data-sticker] .sticker-container');
        return c ? c.style.getPropertyValue('--peel-amount') || getComputedStyle(c).getPropertyValue('--peel-amount') : null;
      })(),
      plane: pick('[data-map-plane]'),
      pin0: pick('[data-pin="0"]'),
      veg: pick('[data-veg]'),
      juggle0: pick('[data-juggle]'),
      jellyD: (() => {
        const p = document.querySelector('.jelly path');
        return p ? p.getAttribute('d').slice(0, 60) : null;
      })(),
      eye: pick('[data-eye="left"]', ['transform']),
    };
  });

for (const y of [0, 900, 2500, 4500, 6200, 7500, 8600, 9500, 10200]) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(1400);
  const s = await grab();
  samples.push(s);
  console.log(
    `y=${String(s.scrollY).padStart(5)} burger=${s.heroBurger?.opacity}/${(s.heroBurger?.transform || '').slice(0, 26)} ` +
      `word=${s.heroWord?.opacity} peel=${s.stickyPeel ?? '-'} plane=${(s.plane?.transform || '-').slice(0, 30)} ` +
      `pin0=${s.pin0?.opacity} veg=${(s.veg?.transform || '-').slice(0, 26)} jug=${s.juggle0?.opacity}`,
  );
}

// ---- 3. eye tracking test (mouse moved left vs right must differ) ----
await page.evaluate(() => window.scrollTo(0, 2800));
await page.waitForTimeout(1500);
await page.mouse.move(200, 400);
await page.waitForTimeout(500);
const eyeL = await page.evaluate(() => getComputedStyle(document.querySelector('[data-eye="left"]')).transform);
await page.mouse.move(1300, 400);
await page.waitForTimeout(500);
const eyeR = await page.evaluate(() => getComputedStyle(document.querySelector('[data-eye="left"]')).transform);
console.log('EYES  left-pos:', eyeL, ' right-pos:', eyeR, ' differ:', eyeL !== eyeR);

// ---- 4. cursor rope test ----
await page.mouse.move(700, 400);
await page.waitForTimeout(400);
await page.mouse.move(760, 460);
await page.waitForTimeout(500);
const cursor = await page.evaluate(() => {
  const d = document.querySelector('[data-cursor-path]')?.getAttribute('d');
  const layer = document.querySelector('[data-cursor-layer]');
  return { d: d ? d.slice(0, 60) : null, opacity: layer ? getComputedStyle(layer).opacity : null };
});
console.log('CURSOR:', JSON.stringify(cursor));

// ---- 5. sticker peel must change between two scroll positions ----
await page.evaluate(() => {
  const el = document.querySelector('[data-sticker] .sticker-container');
  el?.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(1400);
const peelA = await page.evaluate(() => document.querySelector('[data-sticker] .sticker-container')?.style.getPropertyValue('--peel-amount'));
await page.evaluate(() => window.scrollBy(0, 500));
await page.waitForTimeout(1400);
const peelB = await page.evaluate(() => document.querySelector('[data-sticker] .sticker-container')?.style.getPropertyValue('--peel-amount'));
console.log('PEEL  before:', peelA, ' after:', peelB, ' changed:', peelA !== peelB);

// ---- 6. motion screenshots (two frames 700ms apart at same scroll = must differ) ----
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(2500);
const a = await page.screenshot({ path: path.join(SHOTS, 'frame-a.png') });
await page.waitForTimeout(700);
const b = await page.screenshot({ path: path.join(SHOTS, 'frame-b.png') });
console.log('frames byteEqual:', Buffer.compare(a, b) === 0);

fs.writeFileSync(path.join(SHOTS, 'samples.json'), JSON.stringify(samples, null, 2));
console.log('ERRORS:', errs.length ? errs.slice(0, 8).join(' | ') : 'none');
await browser.close();

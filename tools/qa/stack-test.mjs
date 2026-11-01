// Acceptance test for the pinned stack. Measures actual layer positions at
// precise scroll progress points and captures halfway states.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-stack');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errs.push(m.text().slice(0, 140));
});
page.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url().split('/').pop()));

await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);

// Discover the pinned region: the pin spacer starts at the section top.
const geo = await page.evaluate(() => {
  const sec = document.querySelector('[data-rk-sig]');
  const spacer = sec.parentElement?.classList.contains('pin-spacer') ? sec.parentElement : null;
  const l = document.querySelector('[data-rk-sig-layer="0"]');
  return {
    docH: document.body.scrollHeight,
    secTop: Math.round(sec.getBoundingClientRect().top + window.scrollY),
    secH: Math.round(sec.offsetHeight),
    spacerH: spacer ? Math.round(spacer.offsetHeight) : null,
    layerH: l ? Math.round(l.getBoundingClientRect().height) : null,
    pinned: sec.parentElement?.classList.contains('pin-spacer') || false,
    stageH: Math.round(document.querySelector('[data-rk-sig-stage]').getBoundingClientRect().height),
  };
});
console.log('GEO:', JSON.stringify(geo));

if (!geo.pinned) {
  console.log('!! NOT PINNED — pin-spacer missing');
}

const pinStart = geo.secTop;
const pinDist = geo.spacerH ? geo.spacerH - geo.secH : 0;
console.log(`pin range: ${pinStart} .. ${pinStart + pinDist}  (distance ${pinDist}px)`);

// Sample layers at 0, 12.5, 25, ... 100% of the pin
console.log('\nprogress | counter | active | layer y-offsets (px relative to stage top)');
const samples = [];
for (let i = 0; i <= 8; i++) {
  const p = i / 8;
  const y = Math.round(pinStart + pinDist * p);
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(800);

  const s = await page.evaluate(() => {
    const stage = document.querySelector('[data-rk-sig-stage]').getBoundingClientRect();
    const layers = [...document.querySelectorAll('[data-rk-sig-layer]')];
    return {
      scrollY: Math.round(window.scrollY),
      counter: document.querySelector('[data-rk-sig-current]')?.textContent,
      offsets: layers.map((l) => {
        const r = l.getBoundingClientRect();
        return Math.round(r.top - stage.top);
      }),
      active: layers.findIndex((l) => l.classList.contains('is-active')),
      stageTop: Math.round(stage.top),
      leftTop: Math.round(document.querySelector('[data-rk-sig-eyebrow]').getBoundingClientRect().top),
    };
  });
  samples.push({ p, ...s });
  console.log(
    `  ${String(Math.round(p * 100)).padStart(3)}%  y=${String(s.scrollY).padStart(5)}  ${s.counter}  active=${s.active}  [${s.offsets.join(', ')}]  stageTop=${s.stageTop} leftTop=${s.leftTop}`,
  );

  if (i % 2 === 1) {
    await page.screenshot({ path: path.join(OUT, `p${Math.round(p * 100)}.png`) });
  }
}

// Assertions
console.log('\n── ASSERTIONS ──');
const at0 = samples[0];
const at100 = samples[8];
const stageH = geo.stageH;

console.log(`initial: layer0 offset=${at0.offsets[0]} (expect 0) ${at0.offsets[0] === 0 ? '✓' : '✗'}`);
console.log(`initial: others below stage (>= stage height) [${at0.offsets.slice(1).join(',')}] vs ${stageH} ${at0.offsets.slice(1).every((o) => o >= stageH - 2) ? '✓' : '✗'}`);
console.log(`final: last layer offset=${at100.offsets[3]} (expect 0) ${at100.offsets[3] === 0 ? '✓' : '✗'}`);

// halfway stacking: at p=0.5, at least two layers should be partially visible
const mid = samples[4];
const partial = mid.offsets.filter((o) => o > -stageH && o < stageH).length;
console.log(`midway (50%): layers partly in stage = ${partial} (expect >=2) ${partial >= 2 ? '✓' : '✗'}`);

// left column must not move during the pin
const leftTops = samples.filter((s) => s.p >= 0.125).map((s) => s.leftTop);
const leftStable = new Set(leftTops).size === 1;
console.log(`left column stationary through pin: tops=[${leftTops.join(',')}] ${leftStable ? '✓' : '✗'}`);

// counter monotonic increasing
const counters = samples.map((s) => Number(s.counter));
const monotonic = counters.every((c, i) => i === 0 || c >= counters[i - 1]);
console.log(`counter monotonic 01->04: [${counters.join(',')}] ${monotonic ? '✓' : '✗'}`);

// reverse
await page.evaluate((yy) => window.scrollTo(0, yy), pinStart + pinDist);
await page.waitForTimeout(900);
const backSamples = [];
for (let i = 8; i >= 0; i -= 2) {
  const p = i / 8;
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(pinStart + pinDist * p));
  await page.waitForTimeout(900);
  const s = await page.evaluate(() => ({
    counter: document.querySelector('[data-rk-sig-current]')?.textContent,
    off0: Math.round(
      document.querySelector('[data-rk-sig-layer="0"]').getBoundingClientRect().top -
        document.querySelector('[data-rk-sig-stage]').getBoundingClientRect().top,
    ),
    off3: Math.round(
      document.querySelector('[data-rk-sig-layer="3"]').getBoundingClientRect().top -
        document.querySelector('[data-rk-sig-stage]').getBoundingClientRect().top,
    ),
  }));
  backSamples.push({ p, ...s });
}
console.log('\nreverse:', backSamples.map((b) => `${Math.round(b.p * 100)}%:${b.counter}(L4=${b.off3})`).join(' '));
const reverses = backSamples[backSamples.length - 1].counter === '01';
console.log(`reverse returns to 01: ${reverses ? '✓' : '✗'}`);

console.log('\nerrors:', errs.length ? errs.slice(0, 5).join(' | ') : 'none');
await browser.close();

// Acceptance test for the redesigned signature showcase.
// Timing model in signature.ts: each item owns 1/COUNT of the timeline. Inside
// its slice it HOLDS for HOLD fraction, then the next photo slides during the
// remaining (1-HOLD). Sample points below mirror that model exactly.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-show');
fs.mkdirSync(OUT, { recursive: true });

const COUNT = 4;
const HOLD = 0.62;
const SLICE = 1 / COUNT;

/** Middle of item i's settled window. */
const holdPoint = (i) => (i + HOLD / 2) * SLICE;
/** Middle of the slide from item i to i+1. */
const slidePoint = (i) => (i + HOLD + (1 - HOLD) / 2) * SLICE;

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

const geo = await page.evaluate(() => {
  const sec = document.querySelector('[data-rk-sig]');
  const spacer = sec.parentElement;
  return {
    secTop: Math.round(sec.getBoundingClientRect().top + window.scrollY),
    secH: Math.round(sec.offsetHeight),
    spacerH: Math.round(spacer.offsetHeight),
    pinned: spacer.classList.contains('pin-spacer'),
    stageH: Math.round(document.querySelector('[data-rk-sig-stage]').getBoundingClientRect().height),
  };
});
const pinStart = geo.secTop;
const pinDist = geo.spacerH - geo.secH;
console.log('GEO:', JSON.stringify(geo), `pinDist=${pinDist}`);

const read = () =>
  page.evaluate(() => {
    const stage = document.querySelector('[data-rk-sig-stage]').getBoundingClientRect();
    const chapters = [...document.querySelectorAll('[data-rk-sig-chapter]')];
    return {
      counter: document.querySelector('[data-rk-sig-current]')?.textContent,
      activeCh: chapters.findIndex((c) => c.classList.contains('is-active')),
      heading: chapters
        .find((c) => Number(getComputedStyle(c).opacity) > 0.5)
        ?.querySelector('.rk-sig__heading')
        ?.textContent?.trim(),
      offsets: [...document.querySelectorAll('[data-rk-sig-panel]')].map((p) =>
        Math.round(p.getBoundingClientRect().top - stage.top),
      ),
      stageH: Math.round(stage.height),
    };
  });

const go = async (p) => {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(pinStart + pinDist * p));
  await page.waitForTimeout(1000);
};

console.log('\n── 4 SETTLED ITEM STATES ──');
const states = [];
for (let i = 0; i < COUNT; i++) {
  const p = holdPoint(i);
  await go(p);
  const s = await read();
  states.push({ i, ...s });
  console.log(
    `  item ${i + 1} @${(p * 100).toFixed(0)}%: counter=${s.counter} chapter=${s.activeCh} heading="${s.heading}" offsets=[${s.offsets.join(',')}]`,
  );
  await page.screenshot({ path: path.join(OUT, `item-${i + 1}.png`) });
}

console.log('\n── 3 HALFWAY TRANSITIONS ──');
for (let i = 0; i < COUNT - 1; i++) {
  const p = slidePoint(i);
  await go(p);
  const s = await read();
  const inStage = s.offsets.filter((o) => o > -s.stageH && o < s.stageH).length;
  console.log(
    `  ${i + 1}->${i + 2} @${(p * 100).toFixed(0)}%: counter=${s.counter} heading="${s.heading}" offsets=[${s.offsets.join(',')}] in-stage=${inStage}`,
  );
  await page.screenshot({ path: path.join(OUT, `half-${i + 1}${i + 2}.png`) });
}

console.log('\n── REVERSE ──');
const rev = [];
for (let i = COUNT - 1; i >= 0; i--) {
  await go(holdPoint(i));
  const s = await read();
  rev.push(`${s.counter}/${s.heading}`);
}
console.log('  ' + rev.join('  <-  '));

console.log('\n── ASSERTIONS ──');
let pass = true;
states.forEach((s, i) => {
  const wantCounter = String(i + 1).padStart(2, '0');
  const ok = s.counter === wantCounter && s.activeCh === i;
  if (!ok) pass = false;
  console.log(`  item ${i + 1}: counter=${s.counter} (want ${wantCounter}) chapter=${s.activeCh} ${ok ? 'OK' : 'FAIL'}`);
});

const headings = states.map((s) => s.heading);
const uniqueHeadings = new Set(headings).size === COUNT;
if (!uniqueHeadings) pass = false;
console.log(`  headings unique: [${headings.join(' | ')}] ${uniqueHeadings ? 'OK' : 'FAIL'}`);

const panelsSettled = states.every((s, i) => s.offsets[i] === 0);
if (!panelsSettled) pass = false;
console.log(`  own panel at y=0 when settled: ${panelsSettled ? 'OK' : 'FAIL'}`);

const leftTop = await page.evaluate(() => {
  const el = document.querySelector('.rk-sig__left');
  return el ? Math.round(el.getBoundingClientRect().top) : null;
});
console.log(`  left column top (stable): ${leftTop}`);

console.log(`\nRESULT: ${pass ? 'PASS' : 'FAIL'}`);
console.log('errors:', errs.length ? errs.slice(0, 5).join(' | ') : 'none');
await browser.close();

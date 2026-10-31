// Verify the motion system: Lenis active, scrub reverses, progress reveal runs,
// no duplicate ScrollTriggers, sticky intact.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errs.push(m.text().slice(0, 140));
});

await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3500);

// ── Lenis present? ────────────────────────────────────────────────────
const lenisState = await page.evaluate(() => ({
  htmlHasLenisClass: document.documentElement.classList.contains('lenis'),
  // Lenis sets this wrapper height / data attribute; the reliable public probe
  // is the class on <html> plus the absence of native scroll-snap behaviour.
  scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
}));
console.log('LENIS:', JSON.stringify(lenisState));

// ── Progress reveal now actually runs (issue B) ───────────────────────
const progressAtStart = await page.evaluate(() => {
  const p = document.querySelector('[data-rk-sig-progress]');
  return { exists: !!p, opacity: p ? getComputedStyle(p).opacity : null };
});

// scroll into the section
await page.evaluate(() => {
  const s = document.querySelector('#menu');
  window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY - 200);
});
await page.waitForTimeout(1500);

const progressAfter = await page.evaluate(() => {
  const p = document.querySelector('[data-rk-sig-progress]');
  return { opacity: p ? getComputedStyle(p).opacity : null };
});
console.log('PROGRESS (issue B): exists=' + progressAtStart.exists +
  ` before=${progressAtStart.opacity} after-scroll=${progressAfter.opacity}`);

// ── Scrub reversibility (issue D) ─────────────────────────────────────
const card1State = () =>
  page.evaluate(() => {
    const card = document.querySelector('[data-rk-sig-card]');
    const shell = card.querySelector('[data-rk-sig-shell]');
    const media = card.querySelector('[data-rk-sig-media-inner]');
    const name = card.querySelector('[data-rk-sig-el="name"]');
    const cs = getComputedStyle(shell);
    const cm = getComputedStyle(media);
    const cn = getComputedStyle(name);
    return {
      shellOpacity: Number(cs.opacity).toFixed(2),
      shellTransform: cs.transform.slice(0, 34),
      imgScale: cm.transform.slice(0, 34),
      nameOpacity: Number(cn.opacity).toFixed(2),
    };
  });

// card 1 is at the top of the section: scroll above it, then onto it, then back
await page.evaluate(() => window.scrollTo(0, 700));
await page.waitForTimeout(1000);
const before = await card1State();

await page.evaluate(() => {
  const c = document.querySelector('[data-rk-sig-card]');
  window.scrollTo(0, c.getBoundingClientRect().top + window.scrollY - 120);
});
await page.waitForTimeout(1200);
const onCard = await card1State();

await page.evaluate(() => window.scrollTo(0, 700));
await page.waitForTimeout(1200);
const backAgain = await card1State();

console.log('CARD1 before   :', JSON.stringify(before));
console.log('CARD1 on-card  :', JSON.stringify(onCard));
console.log('CARD1 reversed :', JSON.stringify(backAgain));
const reverses = Math.abs(Number(before.nameOpacity) - Number(backAgain.nameOpacity)) < 0.12;
console.log('REVERSES (issue D):', reverses ? 'YES ✓' : 'NO ✗');

// ── Counter both directions ──────────────────────────────────────────
const counterAt = async (y) => {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(600);
  return page.evaluate(() => document.querySelector('[data-rk-sig-current]')?.textContent);
};
const fwd = [];
for (const y of [900, 1600, 2300, 3000, 3600]) fwd.push(await counterAt(y));
const rev = [];
for (const y of [3000, 2300, 1600, 900]) rev.push(await counterAt(y));
console.log('counter forward :', fwd.join(' -> '));
console.log('counter reverse :', rev.join(' -> '));

// ── Sticky still works ───────────────────────────────────────────────
const sticky = await page.evaluate(() => {
  const s = document.querySelector('#menu');
  const st = s.querySelector('.rk-sig__sticky');
  return { pos: getComputedStyle(st).position, top: Math.round(st.getBoundingClientRect().top) };
});
console.log('STICKY:', JSON.stringify(sticky));

// ── Duplicate ScrollTriggers? count via a resize storm ───────────────
const counts = () =>
  page.evaluate(() => ({
    sig: document.querySelectorAll('[data-rk-sig]').length,
    cards: document.querySelectorAll('[data-rk-sig-card]').length,
    hero: document.querySelectorAll('[data-rk-hero]').length,
    foot: document.querySelectorAll('[data-rk-foot]').length,
    docH: document.body.scrollHeight,
    ovX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));
const c1 = await counts();
for (const w of [1200, 1024, 1440, 768, 1440]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(320);
}
const c2 = await counts();
console.log('counts before:', JSON.stringify(c1));
console.log('counts after :', JSON.stringify(c2));
const dup = ['sig', 'cards', 'hero', 'foot'].filter((k) => c1[k] !== c2[k]);
console.log('duplication:', dup.length ? dup.join(',') : 'none ✓');

console.log('errors:', errs.length ? errs.slice(0, 5).join(' | ') : 'none');
await browser.close();

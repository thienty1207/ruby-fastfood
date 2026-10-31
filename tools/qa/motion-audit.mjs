// Full motion verification: 4 viewports, reduced motion, reverse, sticky,
// anchor jump, duplication, console errors.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const URL = 'http://127.0.0.1:5273/';

async function audit(w, opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: 900 },
    ...opts,
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text().slice(0, 120));
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3200);

  const base = await page.evaluate(() => ({
    docH: document.body.scrollHeight,
    ovX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    lenis: document.documentElement.classList.contains('lenis'),
    stickyPos: getComputedStyle(document.querySelector('.rk-sig__sticky')).position,
    progressExists: !!document.querySelector('[data-rk-sig-progress]'),
  }));

  // counter both ways
  const at = async (y) => {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(700);
    return page.evaluate(() => document.querySelector('[data-rk-sig-current]')?.textContent);
  };
  const secTop = await page.evaluate(() => {
    const s = document.querySelector('#menu');
    return Math.round(s.getBoundingClientRect().top + window.scrollY);
  });
  const fwd = [];
  for (const d of [0, 400, 900, 1400, 1900]) fwd.push(await at(secTop + d));
  const rev = [];
  for (const d of [1400, 900, 400, 0]) rev.push(await at(secTop + d));

  // sticky travel
  const stickyTops = [];
  for (const d of [0, 600, 1200, 1800]) {
    await page.evaluate((yy) => window.scrollTo(0, yy), secTop + d);
    await page.waitForTimeout(500);
    stickyTops.push(
      await page.evaluate(() => {
        const st = document.querySelector('.rk-sig__sticky');
        return Math.round(st.getBoundingClientRect().top);
      }),
    );
  }

  await ctx.close();
  return { w, ...base, fwd: fwd.join('>'), rev: rev.join('>'), stickyTops: stickyTops.join(','), errs };
}

for (const w of [1920, 1440, 768, 375]) {
  const r = await audit(w);
  console.log(
    `${String(r.w).padStart(4)}: docH=${r.docH} ovX=${r.ovX} lenis=${r.lenis} sticky=${r.stickyPos} progress=${r.progressExists}`,
  );
  console.log(`      counter fwd ${r.fwd} | rev ${r.rev} | stickyTop ${r.stickyTops}`);
  console.log(`      errors: ${r.errs.length ? r.errs.slice(0, 3).join(' | ') : 'none'}`);
}

// reduced motion
const rm = await audit(1440, { reducedMotion: 'reduce' });
console.log(`\nREDUCED MOTION 1440: lenis=${rm.lenis} (expected false) errors=${rm.errs.length ? rm.errs[0] : 'none'}`);

// reduced motion: is content immediately readable?
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  const readable = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-rk-sig-card]')];
    return cards.map((c) => {
      const name = c.querySelector('[data-rk-sig-el="name"]');
      const shell = c.querySelector('[data-rk-sig-shell]');
      return {
        shellOp: Number(getComputedStyle(shell).opacity).toFixed(2),
        nameOp: Number(getComputedStyle(name).opacity).toFixed(2),
      };
    });
  });
  console.log('REDUCED MOTION readability:', JSON.stringify(readable));
  await ctx.close();
}

// duplication after resize storm
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  const snap = () =>
    page.evaluate(() => ({
      sig: document.querySelectorAll('[data-rk-sig]').length,
      cards: document.querySelectorAll('[data-rk-sig-card]').length,
      shells: document.querySelectorAll('[data-rk-sig-shell]').length,
      hero: document.querySelectorAll('[data-rk-hero]').length,
      foot: document.querySelectorAll('[data-rk-foot]').length,
      docH: document.body.scrollHeight,
    }));
  const a = await snap();
  for (const w of [1200, 1024, 900, 1440, 768, 1920, 1440]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(300);
  }
  const b = await snap();
  console.log('\nbefore:', JSON.stringify(a));
  console.log('after :', JSON.stringify(b));
  const dup = Object.keys(a).filter((k) => k !== 'docH' && a[k] !== b[k]);
  console.log('duplication:', dup.length ? dup.join(',') : 'none ✓');
  await ctx.close();
}
await browser.close();

// Final QA: reduced-motion, reverse-scroll counter, duplicate listeners,
// resize stability, and hero/footer integrity.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

// ── 1. reduced motion ───────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => document.querySelector('#menu').scrollIntoView());
  await page.waitForTimeout(1500);
  const rm = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-rk-sig-card]')];
    return {
      cardOpacities: cards.map((c) => getComputedStyle(c).opacity),
      stickyPos: getComputedStyle(document.querySelector('.rk-sig__sticky')).position,
      counter: document.querySelector('[data-rk-sig-current]')?.textContent,
    };
  });
  console.log('REDUCED MOTION:', JSON.stringify(rm));
  await ctx.close();
}

// ── 2. reverse scroll + duplicate check ────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text().slice(0, 120));
  });
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  const count = () =>
    page.evaluate(() => ({
      sigSection: document.querySelectorAll('[data-rk-sig]').length,
      cards: document.querySelectorAll('[data-rk-sig-card]').length,
      ticks: document.querySelectorAll('[data-rk-sig-tick]').length,
      hero: document.querySelectorAll('[data-rk-hero]').length,
      foot: document.querySelectorAll('[data-rk-foot]').length,
      docH: document.body.scrollHeight,
      ovX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }));

  const before = await count();

  // go down through the section, then back up — counter must follow both ways
  const down = [];
  for (const y of [700, 1400, 2100, 2800, 3400]) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(500);
    down.push(await page.evaluate(() => document.querySelector('[data-rk-sig-current]')?.textContent));
  }
  const up = [];
  for (const y of [2800, 2100, 1400, 700, 200]) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(500);
    up.push(await page.evaluate(() => document.querySelector('[data-rk-sig-current]')?.textContent));
  }

  // resize storm
  for (const w of [1200, 1024, 900, 1440, 768, 1440]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(280);
  }
  const after = await count();

  console.log('down-scroll counters:', down.join(' -> '));
  console.log('up-scroll counters  :', up.join(' -> '));
  console.log('before:', JSON.stringify(before));
  console.log('after :', JSON.stringify(after));
  const keys = ['sigSection', 'cards', 'ticks', 'hero', 'foot'];
  const dup = keys.filter((k) => before[k] !== after[k]);
  console.log(dup.length ? `DUPLICATION in: ${dup.join(', ')}` : 'no duplication after 6 resizes ✓');
  console.log('errors:', errs.length ? errs.slice(0, 4).join(' | ') : 'none');
  await ctx.close();
}
await browser.close();

// QA for the signature section: sticky behaviour, active-card indicator,
// reveal states, and layout integrity at 4 widths.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-sig');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:5273/';
const browser = await chromium.launch({ headless: true });

for (const w of [1920, 1440, 768, 375]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text().slice(0, 140));
  });
  page.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url().split('/').pop()));

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);

  const sig = await page.$('#menu');
  if (!sig) {
    console.log(`\n=== ${w} === #menu NOT FOUND`);
    await ctx.close();
    continue;
  }

  // scroll to the section then walk through it
  await page.evaluate(() => {
    const el = document.querySelector('#menu');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 80);
  });
  await page.waitForTimeout(1400);

  const startTop = await page.evaluate(() => {
    const s = document.querySelector('#menu');
    const st = s.querySelector('.rk-sig__sticky');
    return {
      sectionTop: Math.round(s.getBoundingClientRect().top),
      stickyTop: Math.round(st.getBoundingClientRect().top),
      stickyPos: getComputedStyle(st).position,
      isSticky: getComputedStyle(st).position === 'sticky',
      docH: document.body.scrollHeight,
      ovX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      counter: document.querySelector('[data-rk-sig-current]')?.textContent,
    };
  });

  const secH = await page.evaluate(() => Math.round(document.querySelector('#menu').getBoundingClientRect().height));

  // step through the section, recording sticky top + active counter
  const track = [];
  for (let p = 0; p <= 100; p += 20) {
    const y = await page.evaluate(
      (frac) => {
        const s = document.querySelector('#menu');
        const top = s.getBoundingClientRect().top + window.scrollY;
        return Math.round(top + (s.offsetHeight - window.innerHeight) * frac);
      },
      p / 100,
    );
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(520);
    const st = await page.evaluate(() => {
      const s = document.querySelector('#menu');
      const sticky = s.querySelector('.rk-sig__sticky');
      return {
        stickyTop: Math.round(sticky.getBoundingClientRect().top),
        counter: document.querySelector('[data-rk-sig-current]')?.textContent,
        activeCards: [...document.querySelectorAll('.rk-sig-card.is-current')].length,
      };
    });
    track.push({ p, ...st });
  }

  console.log(`\n=== ${w}px ===`);
  console.log(`  docH=${startTop.docH} ovX=${startTop.ovX} sectionH=${secH}`);
  console.log(`  sticky position=${startTop.stickyPos} (expected sticky at >=1024)`);
  console.log('  walk:', track.map((t) => `${t.p}%:top${t.stickyTop}/${t.counter}`).join('  '));
  const counters = [...new Set(track.map((t) => t.counter))];
  console.log(`  distinct counters seen: ${counters.join(',')}`);
  console.log(`  errors: ${errs.length ? errs.slice(0, 4).join(' | ') : 'none'}`);

  // screenshots at 3 points
  for (const [label, p] of [['a', 0], ['b', 50], ['c', 100]]) {
    const y = await page.evaluate(
      (frac) => {
        const s = document.querySelector('#menu');
        const top = s.getBoundingClientRect().top + window.scrollY;
        return Math.round(top + (s.offsetHeight - window.innerHeight) * frac);
      },
      p / 100,
    );
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, `${w}-${label}.png`) });
  }
  await ctx.close();
}
await browser.close();

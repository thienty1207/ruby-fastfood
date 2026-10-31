// Final regression: nav anchors through Lenis, wheel scroll, mid-scroll resize,
// reduced motion, and full sequence capture.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-motion');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

// ── 1. nav anchor goes through Lenis and lands correctly ─────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // click nav MENU
  await page.evaluate(() => document.querySelector('[data-rk-nav-link][href="#menu"]').click());
  await page.waitForTimeout(2200);
  const r = await page.evaluate(() => {
    const eb = document.querySelector('.rk-sig__eyebrow').getBoundingClientRect();
    const nav = document.querySelector('[data-rk-nav]').getBoundingClientRect();
    return {
      ebTop: Math.round(eb.top),
      navBottom: Math.round(nav.bottom),
      scrollY: Math.round(window.scrollY),
      clear: eb.top >= nav.bottom,
    };
  });
  console.log('nav MENU click:', JSON.stringify(r), r.clear ? '✓' : '✗ covered');
  console.log('errors:', errs.length ? errs[0] : 'none');
  await ctx.close();
}

// ── 2. wheel scroll through the whole page ───────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  const counters = [];
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel(0, 220);
    await page.waitForTimeout(90);
    if (i % 6 === 0) {
      counters.push(
        await page.evaluate(() => ({
          y: Math.round(window.scrollY),
          c: document.querySelector('[data-rk-sig-current]')?.textContent,
        })),
      );
    }
  }
  console.log('\nwheel walk:', counters.map((x) => `${x.y}:${x.c}`).join(' '));
  console.log('wheel errors:', errs.length ? errs[0] : 'none');
  await ctx.close();
}

// ── 3. resize while halfway through the section ──────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  const secTop = await page.evaluate(() => {
    const s = document.querySelector('#menu');
    return Math.round(s.getBoundingClientRect().top + window.scrollY);
  });
  await page.evaluate((yy) => window.scrollTo(0, yy), secTop + 700);
  await page.waitForTimeout(900);

  for (const w of [1200, 900, 1440]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(500);
  }
  const after = await page.evaluate(() => {
    const s = document.querySelector('#menu');
    const st = s.querySelector('.rk-sig__sticky');
    const card = document.querySelector('[data-rk-sig-card]');
    const shell = card.querySelector('[data-rk-sig-shell]');
    return {
      ovX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      stickyPos: getComputedStyle(st).position,
      stickyTop: Math.round(st.getBoundingClientRect().top),
      shellOp: Number(getComputedStyle(shell).opacity).toFixed(2),
      counter: document.querySelector('[data-rk-sig-current]')?.textContent,
      docH: document.body.scrollHeight,
    };
  });
  console.log('\nmid-scroll resize:', JSON.stringify(after));
  console.log('errors:', errs.length ? errs[0] : 'none');
  await ctx.close();
}

// ── 4. sequence capture for the report ───────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3200);
  const seq = [
    ['01-hero', 0],
    ['02-handoff', 620],
    ['03-menu-intro', 900],
    ['04-card1', 1150],
    ['05-card2', 1750],
    ['06-card3', 2350],
    ['07-card4', 2950],
    ['08-footer', 4200],
  ];
  for (const [tag, y] of seq) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(1100);
    await page.screenshot({ path: path.join(OUT, `seq-${tag}.png`) });
  }
  console.log('\nsequence captured:', seq.length, 'frames');
  await ctx.close();
}
await browser.close();

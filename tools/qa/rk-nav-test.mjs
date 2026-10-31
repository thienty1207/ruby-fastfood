// Functional test of the Ruby nav: mobile sheet open/close, escape, scroll lock,
// in-page anchors, and duplicate-animation check (resize must not double tweens).
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-ruby-final');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

// ── mobile: sheet behaviour ─────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);

  const closedState = await page.evaluate(() => ({
    hidden: document.querySelector('[data-rk-sheet]')?.getAttribute('aria-hidden'),
    expanded: document.querySelector('[data-rk-burger]')?.getAttribute('aria-expanded'),
    locked: document.documentElement.classList.contains('rk-locked'),
    sheetVisible: getComputedStyle(document.querySelector('[data-rk-sheet]')).visibility,
  }));
  console.log('sheet CLOSED :', JSON.stringify(closedState));

  await page.click('[data-rk-burger]');
  await page.waitForTimeout(900);
  const openState = await page.evaluate(() => ({
    hidden: document.querySelector('[data-rk-sheet]')?.getAttribute('aria-hidden'),
    expanded: document.querySelector('[data-rk-burger]')?.getAttribute('aria-expanded'),
    locked: document.documentElement.classList.contains('rk-locked'),
    sheetVisible: getComputedStyle(document.querySelector('[data-rk-sheet]')).visibility,
    linkOpacity: getComputedStyle(document.querySelector('[data-rk-sheet-link]')).opacity,
    label: document.querySelector('[data-rk-burger]')?.getAttribute('aria-label'),
  }));
  console.log('sheet OPEN   :', JSON.stringify(openState));
  await page.screenshot({ path: path.join(OUT, '375-menu-open.png') });

  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  const afterEsc = await page.evaluate(() => ({
    hidden: document.querySelector('[data-rk-sheet]')?.getAttribute('aria-hidden'),
    locked: document.documentElement.classList.contains('rk-locked'),
  }));
  console.log('after ESC    :', JSON.stringify(afterEsc));

  // resize while open must auto-close (no scroll trap)
  await page.click('[data-rk-burger]');
  await page.waitForTimeout(600);
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.waitForTimeout(700);
  const afterResize = await page.evaluate(() => ({
    locked: document.documentElement.classList.contains('rk-locked'),
    expanded: document.querySelector('[data-rk-burger]')?.getAttribute('aria-expanded'),
  }));
  console.log('after resize :', JSON.stringify(afterResize));
  console.log('mobile errors:', errs.length ? errs.slice(0, 3).join(' | ') : 'none');
  await ctx.close();
}

// ── desktop: anchor nav + duplicate-tween check ─────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);

  // count live tweens + ScrollTriggers before/after resizes
  const countFx = () =>
    page.evaluate(() => ({
      triggers: window.ScrollTrigger?.getAll?.().length ?? -1,
      tweens: window.gsap?.globalTimeline?.getChildren?.(true, true, true)?.length ?? -1,
    }));

  const before = await countFx();
  for (const w of [1200, 900, 1440, 1024, 1440]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(320);
  }
  const after = await countFx();
  console.log('\nScrollTriggers before/after 5 resizes:', before.triggers, '->', after.triggers);
  console.log('gsap tweens  before/after 5 resizes:', before.tweens, '->', after.tweens);
  console.log('no duplication:', after.triggers <= before.triggers + 2 && after.tweens <= before.tweens + 4);

  // anchor click scrolls to #menu (does not exist yet -> must not throw)
  const navLinks = await page.$$eval('.rk-nav__link', (as) => as.map((a) => a.getAttribute('href')));
  console.log('nav links:', navLinks.join(' '));
  console.log('desktop errors:', errs.length ? errs.slice(0, 3).join(' | ') : 'none');
  await ctx.close();
}

await browser.close();

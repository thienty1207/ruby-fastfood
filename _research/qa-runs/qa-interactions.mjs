// Interaction QA: smooth scroll, hover states, menu, morph button, cursor hide.
import { chromium } from 'playwright';
import path from 'node:path';

const OUT = process.cwd();
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);

// 1. LENIS smooth scroll: wheel must move less than a raw jump, and settle eased
const before = await page.evaluate(() => window.scrollY);
await page.mouse.move(700, 500);
await page.mouse.wheel(0, 1200);
await page.waitForTimeout(120);
const during = await page.evaluate(() => window.scrollY);
await page.waitForTimeout(1200);
const after = await page.evaluate(() => window.scrollY);
console.log(`SMOOTH SCROLL  before=${before} during=${during} settled=${after}  eased=${during > before && during < after}`);

// 2. NAV HIDE on scroll down / SHOW on scroll up
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(900);
await page.evaluate(() => window.scrollTo(0, 400));
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, 1800));
await page.waitForTimeout(1200);
const navHidden = await page.evaluate(() => {
  const n = document.querySelector('nav');
  const ty = new DOMMatrix(getComputedStyle(n).transform).m42;
  return Math.round(ty);
});
await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(1200);
const navShown = await page.evaluate(() => Math.round(new DOMMatrix(getComputedStyle(document.querySelector('nav')).transform).m42));
console.log(`NAV hide/show  hiddenY=${navHidden} (should be negative)  shownY=${navShown} (should be ~0)`);

// 3. MENU open: panel scale/opacity + bar morph + label swap
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
await page.click('[data-menu-toggle]');
await page.waitForTimeout(1100);
const menu = await page.evaluate(() => {
  const p = document.querySelector('[data-menu-panel]');
  const cs = getComputedStyle(p);
  const m = cs.transform.match(/matrix\(([^)]+)\)/);
  const topBar = document.querySelector('[data-bar-top]');
  return {
    opacity: cs.opacity,
    scale: m ? Math.round(Number(m[1].split(',')[0]) * 100) / 100 : null,
    label: document.querySelector('[data-menu-label]')?.textContent?.trim(),
    barRotation: topBar ? Math.round(new DOMMatrix(getComputedStyle(topBar).transform).m11) : null,
    ariaExpanded: document.querySelector('[data-menu-toggle]')?.getAttribute('aria-expanded'),
    itemOpacities: [...document.querySelectorAll('[data-menu-item]')].map((i) => getComputedStyle(i).opacity),
  };
});
console.log('MENU OPEN', JSON.stringify(menu));
await page.screenshot({ path: path.join(OUT, 'qa-anim', 'menu-open.png') });
await page.keyboard.press('Escape');
await page.waitForTimeout(900);
const menuClosed = await page.evaluate(() => getComputedStyle(document.querySelector('[data-menu-panel]')).opacity);
console.log(`MENU ESC close  opacity now=${menuClosed}`);

// 4. ROLLING LABEL hover (footer nav): second span translates on hover
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1500);
const rollBefore = await page.evaluate(() => {
  const a = document.querySelector('footer nav a span.relative');
  return a ? getComputedStyle(a.lastElementChild).transform : null;
});
const footerLink = await page.$('footer nav a');
if (footerLink) await footerLink.hover();
await page.waitForTimeout(500);
const rollAfter = await page.evaluate(() => {
  const a = document.querySelector('footer nav a span.relative');
  return a ? getComputedStyle(a.lastElementChild).transform : null;
});
console.log(`ROLLING LABEL  before=${rollBefore}  after=${rollAfter}  changed=${rollBefore !== rollAfter}`);

// 5. BLOB MORPH hover on Order button
await page.evaluate(() => {
  const b = document.querySelector('#about [data-order-btn] a');
  b?.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(1200);
const blobBefore = await page.evaluate(() => document.querySelector('#about .blob-path')?.getAttribute('d')?.slice(0, 30));
const orderBtn = await page.$('#about [data-order-btn] a');
if (orderBtn) await orderBtn.hover();
await page.waitForTimeout(700);
const blobAfter = await page.evaluate(() => document.querySelector('#about .blob-path')?.getAttribute('d')?.slice(0, 30));
console.log(`BLOB MORPH  before=${blobBefore}\n            after =${blobAfter}\n            changed=${blobBefore !== blobAfter}`);

// 6. CURSOR rope appears and follows
await page.evaluate(() => window.scrollTo(0, 1200));
await page.waitForTimeout(1000);
await page.mouse.move(500, 400);
await page.waitForTimeout(300);
await page.mouse.move(560, 430);
await page.waitForTimeout(400);
const cursor = await page.evaluate(() => {
  const l = document.querySelector('[data-cursor-layer]');
  const p = document.querySelector('[data-cursor-path]');
  return { opacity: getComputedStyle(l).opacity, d: p?.getAttribute('d')?.slice(0, 40), knots: document.querySelectorAll('[data-cursor-knot]').length };
});
console.log('CURSOR', JSON.stringify(cursor));

console.log('ERRORS:', errs.length ? errs.slice(0, 5).join(' | ') : 'none');
await browser.close();

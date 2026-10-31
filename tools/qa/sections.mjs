// Baseline + per-section screenshots at 375 / 768 / 1440.
// Also reports: console errors, horizontal overflow, broken images.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), process.argv[2] || 'qa-baseline');
fs.mkdirSync(OUT, { recursive: true });
const URL = process.argv[3] || 'http://127.0.0.1:5273/';
const browser = await chromium.launch({ headless: true });

for (const vp of [
  { name: '1440', width: 1440, height: 900 },
  { name: '768', width: 768, height: 1024 },
  { name: '375', width: 375, height: 812 },
]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  page.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url().split('/').pop()));

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const H = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += vp.height * 0.8) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(200);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2000);

  const stats = await page.evaluate(() => ({
    docH: document.body.scrollHeight,
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    broken: [...document.images].filter((i) => i.naturalWidth === 0).map((i) => i.src.split('/').pop()),
    sections: [...document.querySelectorAll('section,footer,nav')].map((s) => (s.id || s.tagName.toLowerCase()) + ':' + Math.round(s.getBoundingClientRect().height)),
  }));

  // hero + full slices
  await page.screenshot({ path: path.join(OUT, `${vp.name}-hero.png`) });
  const slices = Math.min(6, Math.ceil(H / vp.height));
  for (let i = 0; i < slices; i++) {
    await page.evaluate((yy) => window.scrollTo(0, yy), i * vp.height);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, `${vp.name}-s${i}.png`) });
  }

  console.log(`\n=== ${vp.name} ===`);
  console.log(`  docH       ${stats.docH}`);
  console.log(`  scrollW    ${stats.scrollW} / client ${stats.clientW}  overflowX=${stats.overflowX}`);
  console.log(`  sections   ${stats.sections.join(' ')}`);
  if (stats.broken.length) console.log(`  BROKEN     ${stats.broken.join(', ')}`);
  if (errs.length) console.log(`  ERRORS     ${errs.slice(0, 5).join(' | ')}`);
  else console.log('  errors     none');
  await ctx.close();
}
await browser.close();

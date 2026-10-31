// Visual QA: compare original vs clone at 1440 / 768 / 390.
// Uses CLIPPED per-viewport screenshots (fullPage stalls on the original: its
// font-loading never settles, so Playwright's screenshot wait hangs).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.cwd();
const ORIG = 'https://www.cravburgers.shop/';
const CLONE = 'http://localhost:5273/';
const SHOTS = path.join(OUT, 'qa');
fs.mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [
  { w: 1440, h: 900, name: '1440' },
  { w: 768, h: 1024, name: '768' },
  { w: 390, h: 844, name: '390' },
];

const browser = await chromium.launch({ headless: true });
const results = [];

const nm = (u) => (u.includes('cravburgers') ? 'orig' : 'clone');

async function capture(url, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160));
  });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(7000);

  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /okay|accept|agree/i.test(x.textContent || ''));
    b?.click();
  });
  await page.waitForTimeout(900);

  const H = await page.evaluate(() => document.body.scrollHeight);

  // settle every scroll-driven trigger, then return to top
  for (let y = 0; y < H + vp.h; y += Math.round(vp.h * 0.55)) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(200);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2600);

  const heights = await page.evaluate(() =>
    [...document.querySelectorAll('section, footer')].map((s) => ({
      id: s.id || s.tagName.toLowerCase(),
      h: Math.round(s.getBoundingClientRect().height),
      top: Math.round(s.getBoundingClientRect().top + window.scrollY),
      w: Math.round(s.getBoundingClientRect().width),
      bg: getComputedStyle(s).backgroundColor,
    })),
  );

  const slices = Math.min(12, Math.ceil(H / vp.h));
  for (let i = 0; i < slices; i++) {
    await page.evaluate((yy) => window.scrollTo(0, yy), i * vp.h);
    await page.waitForTimeout(700);
    await page.screenshot({
      path: path.join(SHOTS, `${vp.name}-${nm(url)}-s${String(i).padStart(2, '0')}.png`),
      animations: 'disabled',
      timeout: 60000,
    });
  }

  await ctx.close();
  return { heights, docH: H, errors };
}

for (const vp of VIEWPORTS) {
  console.log('=== viewport', vp.name, '===');
  const o = await capture(ORIG, vp);
  const c = await capture(CLONE, vp);
  results.push({ vp: vp.name, orig: o, clone: c });
  console.log(`  doc height  orig=${o.docH}  clone=${c.docH}  delta=${c.docH - o.docH}`);
  const n = Math.max(o.heights.length, c.heights.length);
  for (let i = 0; i < n; i++) {
    const a = o.heights[i];
    const b = c.heights[i];
    console.log(
      `   ${(a?.id ?? b?.id ?? '-').padEnd(13)} orig=${String(a?.h ?? '-').padStart(6)} clone=${String(
        b?.h ?? '-',
      ).padStart(6)}  d=${String(a && b ? b.h - a.h : '?').padStart(6)}`,
    );
  }
  if (c.errors.length) console.log('  CLONE ERRORS:', c.errors.slice(0, 8).join(' | '));
  if (o.errors.length) console.log('  orig errors:', o.errors.slice(0, 3).join(' | '));
}

fs.writeFileSync(path.join(SHOTS, 'structure.json'), JSON.stringify(results, null, 2));
await browser.close();
console.log('done');

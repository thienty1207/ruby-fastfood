// Clone-only determinism: 3 runs per breakpoint, measure ONLY after all images
// decode. The original is external and flaky; the question that matters is
// "does the clone render the same thing every time", plus "does it match the
// original's numbers we recorded as stable".
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

async function measure(vp) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  const H = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 500) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; })),
    );
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1800);
  const out = await page.evaluate(() => ({
    doc: document.body.scrollHeight,
    secs: Object.fromEntries(
      [...document.querySelectorAll('section, footer')].map((s) => [s.id || s.tagName.toLowerCase(), Math.round(s.getBoundingClientRect().height)]),
    ),
    broken: [...document.images].filter((i) => i.naturalWidth === 0).map((i) => i.src.split('/').pop()),
    fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family).filter((v, i, a) => a.indexOf(v) === i),
  }));
  await ctx.close();
  return out;
}

for (const [name, vp] of [['1440', { width: 1440, height: 900 }], ['768', { width: 768, height: 1024 }], ['390', { width: 390, height: 844 }]]) {
  const runs = [await measure(vp), await measure(vp), await measure(vp)];
  const stable = runs.every((r) => r.doc === runs[0].doc && JSON.stringify(r.secs) === JSON.stringify(runs[0].secs));
  console.log(`\n${name}: doc=${runs.map((r) => r.doc).join(' / ')}  stable=${stable}`);
  console.log('   ', JSON.stringify(runs[0].secs));
  console.log('    fonts loaded:', runs[0].fonts.join(', '));
  if (runs[0].broken.length) console.log('    BROKEN IMGS:', runs[0].broken.join(', '));
}
await browser.close();

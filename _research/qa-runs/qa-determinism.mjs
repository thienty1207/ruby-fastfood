// Determinism check: measure the CLONE twice at each breakpoint.
// If the clone is stable and the original isn't, the "delta" is the original's
// lazy-image/measure instability, not a clone defect.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

async function measure(url, vp, settle) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(7000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /okay|accept/i.test(x.textContent || ''));
    b?.click();
  });
  const H = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 500) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(180);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  // wait for every <img> to finish decoding before measuring
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; })),
    );
  });
  await page.waitForTimeout(settle);
  const out = await page.evaluate(() => ({
    doc: document.body.scrollHeight,
    secs: [...document.querySelectorAll('section, footer')].map((s) => (s.id || s.tagName.toLowerCase()) + ':' + Math.round(s.getBoundingClientRect().height)),
    brokenImgs: [...document.images].filter((i) => i.naturalWidth === 0).map((i) => i.src.split('/').pop()),
  }));
  await ctx.close();
  return out;
}

const VPS = [
  { name: '1440', vp: { width: 1440, height: 900 } },
  { name: '768', vp: { width: 768, height: 1024 } },
  { name: '390', vp: { width: 390, height: 844 } },
];

console.log('CLONE determinism (2 runs, images fully loaded before measure):');
for (const { name, vp } of VPS) {
  const a = await measure('http://127.0.0.1:5273/', vp, 2200);
  const b = await measure('http://127.0.0.1:5273/', vp, 2200);
  const same = a.doc === b.doc && JSON.stringify(a.secs) === JSON.stringify(b.secs);
  console.log(`  ${name}: run1 doc=${a.doc}  run2 doc=${b.doc}  stable=${same}`);
  console.log(`      ${a.secs.join('  ')}`);
  if (a.brokenImgs.length) console.log(`      BROKEN IMAGES: ${a.brokenImgs.join(', ')}`);
}

console.log('\nORIGINAL determinism (2 runs, same procedure):');
for (const { name, vp } of VPS) {
  const a = await measure('https://www.cravburgers.shop/', vp, 2200);
  const b = await measure('https://www.cravburgers.shop/', vp, 2200);
  const same = a.doc === b.doc && JSON.stringify(a.secs) === JSON.stringify(b.secs);
  console.log(`  ${name}: run1 doc=${a.doc}  run2 doc=${b.doc}  stable=${same}`);
  console.log(`      ${a.secs.join('  ')}`);
}
await browser.close();

// Fine-grained counter check at 768 + verify hero restores when scrolling back up
// + anchor jump lands below nav.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

// ── 1. fine counter sweep at 768 ──────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 768, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  const { secTop, secH } = await page.evaluate(() => {
    const s = document.querySelector('#menu');
    return {
      secTop: Math.round(s.getBoundingClientRect().top + window.scrollY),
      secH: Math.round(s.offsetHeight),
    };
  });

  // step every 80px through the whole section
  const seen = [];
  let last = null;
  for (let d = 0; d <= secH - 700; d += 80) {
    await page.evaluate((yy) => window.scrollTo(0, yy), secTop + d);
    await page.waitForTimeout(220);
    const c = await page.evaluate(() => document.querySelector('[data-rk-sig-current]')?.textContent);
    if (c !== last) {
      seen.push(`${c}@${d}`);
      last = c;
    }
  }
  console.log('768 counter transitions:', seen.join(' -> '));
  const nums = seen.map((s) => Number(s.split('@')[0]));
  const monotonic = nums.every((n, i) => i === 0 || n >= nums[i - 1]);
  console.log('768 monotonic forward:', monotonic ? 'YES ✓' : 'NO ✗');
  await ctx.close();
}

// ── 2. hero restores on scroll back up ───────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  const heroState = () =>
    page.evaluate(() => {
      const inner = document.querySelector('.rk-hero__inner');
      const photo = document.querySelector('[data-rk-photo-img]');
      const cs = getComputedStyle(inner);
      return {
        innerOp: Number(cs.opacity).toFixed(2),
        innerTf: cs.transform.slice(0, 32),
        photoTf: photo ? getComputedStyle(photo).transform.slice(0, 32) : 'n/a',
      };
    });

  console.log('\nhero at top     :', JSON.stringify(await heroState()));
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(1200);
  console.log('hero mid-handoff:', JSON.stringify(await heroState()));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1400);
  const restored = await heroState();
  console.log('hero back at top:', JSON.stringify(restored));
  console.log('hero fully restored:', restored.innerOp === '1.00' ? 'YES ✓' : 'NO — stuck at ' + restored.innerOp);
  await ctx.close();
}

// ── 3. anchor jump from hero CTA ─────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    const a = document.querySelector('a[href="#menu"]');
    a.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('a[href="#menu"]').click());
  await page.waitForTimeout(2000);
  const r = await page.evaluate(() => {
    const eb = document.querySelector('.rk-sig__eyebrow').getBoundingClientRect();
    const nav = document.querySelector('[data-rk-nav]').getBoundingClientRect();
    return { ebTop: Math.round(eb.top), navBottom: Math.round(nav.bottom), covered: eb.top < nav.bottom };
  });
  console.log('\n375 anchor jump:', JSON.stringify(r), r.covered ? 'COVERED ✗' : 'clear ✓');
  await ctx.close();
}
await browser.close();

// Verify the clip-path reveal scrubs correctly and resets under reduced motion.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-clip');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

// ── normal: sample clip-path through card 2's band ───────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3200);

  const band = await page.evaluate(() => {
    const c = [...document.querySelectorAll('[data-rk-sig-card]')][1];
    const top = c.getBoundingClientRect().top + window.scrollY;
    return {
      start: Math.round(top - window.innerHeight * 0.92),
      end: Math.round(top - window.innerHeight * 0.42),
    };
  });

  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const y = Math.round(band.start + (band.end - band.start) * p);
    await page.evaluate((yy) => window.scrollTo(0, yy), Math.max(0, y));
    await page.waitForTimeout(1400);
    const s = await page.evaluate(() => {
      const c = [...document.querySelectorAll('[data-rk-sig-card]')][1];
      const media = c.querySelector('[data-rk-sig-media]');
      const shell = c.querySelector('[data-rk-sig-shell]');
      return {
        y: Math.round(window.scrollY),
        clip: getComputedStyle(media).clipPath,
        shellOp: Number(getComputedStyle(shell).opacity).toFixed(2),
      };
    });
    console.log(`p=${p.toFixed(2)} y=${s.y} clip=${s.clip} shellOp=${s.shellOp}`);
    if (p === 0.25 || p === 0.5) {
      await page.screenshot({ path: path.join(OUT, `clip-${Math.round(p * 100)}.png`) });
    }
  }
  console.log('errors:', errs.length ? errs[0] : 'none');
  await ctx.close();
}

// ── reversed: scroll back up, clip must re-open downward ─────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  const at = async (y) => {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(1200);
    return page.evaluate(() => {
      const media = document.querySelector('[data-rk-sig-media]');
      return getComputedStyle(media).clipPath;
    });
  };
  const card1 = await page.evaluate(() => {
    const c = document.querySelector('[data-rk-sig-card]');
    return Math.round(c.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.7);
  });
  console.log('\nreverse test — card1 clip:');
  console.log('  at band start:', await at(card1 - 200));
  console.log('  settled      :', await at(card1 + 300));
  console.log('  back up      :', await at(card1 - 200));
  await ctx.close();
}

// ── reduced motion: clip must be none ────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const medias = [...document.querySelectorAll('[data-rk-sig-media]')];
    return medias.map((m) => getComputedStyle(m).clipPath);
  });
  console.log('\nreduced motion clips:', JSON.stringify(r));
  const allNone = r.every((c) => c === 'none');
  console.log('all visible (no mask):', allNone ? 'YES ✓' : 'NO ✗');
  await ctx.close();
}
await browser.close();

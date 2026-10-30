import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-final');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const [label, url] of [['orig', 'https://www.cravburgers.shop/'], ['clone', 'http://127.0.0.1:5273/']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(6500);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /okay|accept/i.test(x.textContent || ''));
    b?.click();
  });
  await page.waitForTimeout(600);
  const H = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 700) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(180);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);

  // measure the big CRAV h2
  const m = await page.evaluate(() => {
    const h2 = [...document.querySelectorAll('footer h2')].find((h) => /CRAV/i.test(h.textContent || ''));
    if (!h2) return null;
    const cs = getComputedStyle(h2);
    const span = h2.querySelector('span:not(.sr-only)');
    const scs = span ? getComputedStyle(span) : null;
    return {
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      stroke: cs.webkitTextStroke,
      paintOrder: cs.paintOrder,
      font: cs.fontFamily.slice(0, 30),
      spanW: span ? Math.round(span.getBoundingClientRect().width) : null,
      h2W: Math.round(h2.getBoundingClientRect().width),
      letterSpacing: cs.letterSpacing,
      text: h2.textContent?.trim().slice(0, 20),
      chars: h2.querySelectorAll('span[data-pop], span[data-pop="true"]').length,
      charBoxes: [...h2.querySelectorAll('span[data-pop], span[data-pop="true"]')].map((c) => Math.round(c.getBoundingClientRect().width)),
    };
  });
  console.log(label, JSON.stringify(m));
  await page.screenshot({ path: path.join(OUT, `footer-${label}.png`) });
  await ctx.close();
}
await browser.close();

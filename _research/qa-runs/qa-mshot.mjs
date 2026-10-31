import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-mobile');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const vp = { width: 390, height: 844 };

for (const [l, u] of [['orig', 'https://www.cravburgers.shop/'], ['clone', 'http://127.0.0.1:5273/']]) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(8000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /okay|accept/i.test(x.textContent || ''));
    b?.click();
  });
  const H = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(OUT, `footer-390-${l}.png`) });
  // also the map-mobile section
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 3000));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, `map-390-${l}.png`) });
  console.log('shot', l);
  await ctx.close();
}
await browser.close();

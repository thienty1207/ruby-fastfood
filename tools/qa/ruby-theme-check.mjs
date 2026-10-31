// Screenshot the recoloured build + verify contrast of the real rendered page.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.join(process.cwd(), 'qa-ruby');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });

await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);
const H = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < H; y += 700) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(260);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(2500);

const theme = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  const h1 = document.querySelector('#hero h1');
  const body = getComputedStyle(document.body);
  return {
    tokens: { bg: v('--bg'), cream: v('--cream'), ruby: v('--ruby'), gold: v('--gold'), ink: v('--ink') },
    aliases: { beige: v('--beige'), white: v('--white'), black: v('--black'), red: v('--red') },
    bodyBg: body.backgroundColor,
    bodyColor: body.color,
    h1Color: h1 ? getComputedStyle(h1).color : null,
    h1Stroke: h1 ? getComputedStyle(h1).webkitTextStroke : null,
    colorScheme: cs.colorScheme,
  };
});
console.log(JSON.stringify(theme, null, 2));
console.log('errors:', errs.length ? errs.slice(0, 5).join(' | ') : 'NONE');

const picks = [['01-hero', 0], ['02-about', 1250], ['03-experience', 3300], ['04-ingredients', 5200], ['05-map', 6300], ['07-cta', 8900], ['08-footer', 9700]];
for (const [name, y] of picks) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}
console.log('screenshots written');
await browser.close();

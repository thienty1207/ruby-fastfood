// Focused probe: find WHERE the footer height and mobile map height differ.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.cwd();
const browser = await chromium.launch({ headless: true });

async function probe(url, vp, sels) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(7000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /okay|accept/i.test(x.textContent || ''));
    b?.click();
  });
  await page.waitForTimeout(600);
  const H = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 500) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(1200);

  const out = await page.evaluate((sels) => {
    const res = {};
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (!el) {
        res[sel] = null;
        continue;
      }
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      res[sel] = {
        h: Math.round(r.height),
        w: Math.round(r.width),
        top: Math.round(r.top + scrollY),
        pad: cs.padding,
        margin: cs.margin,
        display: cs.display,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        transform: cs.transform,
        children: [...el.children].map((c) => ({
          tag: c.tagName.toLowerCase(),
          cls: (typeof c.className === 'string' ? c.className : '').slice(0, 70),
          h: Math.round(c.getBoundingClientRect().height),
          w: Math.round(c.getBoundingClientRect().width),
          margin: getComputedStyle(c).margin,
          pad: getComputedStyle(c).padding,
        })),
      };
    }
    return res;
  }, sels);

  await ctx.close();
  return out;
}

const vp = { w: 1440, h: 900 };
const sels = [
  'footer',
  'footer > div:first-child',
  'footer .mt-\\[10vw\\]',
  'footer h2',
  'footer > div:nth-child(4)',
];
const a = await probe('https://www.cravburgers.shop/', vp, sels);
const b = await probe('http://localhost:5273/', vp, sels);
for (const s of sels) {
  console.log('##########', s);
  console.log(' orig :', JSON.stringify(a[s]));
  console.log(' clone:', JSON.stringify(b[s]));
}

console.log('\n\n===== MOBILE MAP 768 =====');
const vp2 = { w: 768, h: 1024 };
const sels2 = ['#map-mobile', '#map-mobile > div:nth-child(2)', '#map-mobile [data-card]', '#map-mobile [data-card] p', '#map-mobile img'];
const c = await probe('https://www.cravburgers.shop/', vp2, sels2);
const d = await probe('http://localhost:5273/', vp2, sels2);
for (const s of sels2) {
  console.log('##########', s);
  console.log(' orig :', JSON.stringify(c[s]));
  console.log(' clone:', JSON.stringify(d[s]));
}

await browser.close();

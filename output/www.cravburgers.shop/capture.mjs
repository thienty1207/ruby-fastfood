// Capture live outerHTML of every top-level section + chrome, after full hydration.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.cwd();
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto('https://www.cravburgers.shop/', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(6000);
const H = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < H + 2000; y += 500) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(180);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(2500);
// accept cookies so the banner leaves the layout
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /okay/i.test(x.textContent || ''));
  b?.click();
});
await page.waitForTimeout(1200);

const data = await page.evaluate(() => {
  const wrap = document.querySelector('.relative.w-full.h-full');
  const kids = [...wrap.children].map((c, i) => ({
    i,
    tag: c.tagName.toLowerCase(),
    id: c.id,
    cls: (typeof c.className === 'string' ? c.className : '').slice(0, 200),
    h: Math.round(c.getBoundingClientRect().height),
    html: c.outerHTML,
  }));
  return {
    kids,
    header: document.querySelector('nav')?.outerHTML,
    cursor: document.querySelector('.fixed.inset-0.w-full.h-dvh.pointer-events-none')?.outerHTML,
    overlay: document.querySelector('.fixed.inset-0.z-998')?.outerHTML,
    cookie: document.querySelector('.fixed.bottom-\\[2vw\\]')?.outerHTML,
    bodyClass: document.body.className,
    htmlClass: document.documentElement.className,
  };
});
fs.writeFileSync(path.join(OUT, 'live-sections.json'), JSON.stringify(data, null, 2));
console.log('children of wrapper:', data.kids.length);
for (const k of data.kids) console.log(k.i, k.tag, k.id || '', k.h + 'px', k.html.length + 'B', k.cls.slice(0, 80));
await browser.close();

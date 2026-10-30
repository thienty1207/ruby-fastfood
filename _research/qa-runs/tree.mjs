// Deep structure dump of the main wrapper children + screenshots per section.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL = 'https://www.cravburgers.shop/';
const OUT = process.cwd();
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(6000);
const H = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < H + 2000; y += 600) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(200);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(2500);

const tree = await page.evaluate(() => {
  const style = (el) => {
    const cs = getComputedStyle(el);
    return [cs.position, cs.display, cs.fontSize, cs.color, cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : ''].filter(Boolean).join('|');
  };
  const walk = (el, depth) => {
    const r = el.getBoundingClientRect();
    const txt = el.childElementCount === 0 ? el.textContent.trim().slice(0, 60) : '';
    return {
      d: depth,
      tag: el.tagName.toLowerCase(),
      id: el.id || undefined,
      cls: (typeof el.className === 'string' ? el.className : '').slice(0, 160),
      y: Math.round(r.y + window.scrollY),
      h: Math.round(r.height),
      w: Math.round(r.width),
      s: style(el),
      t: txt || undefined,
      kids: depth < 3 ? [...el.children].filter((c) => c.getBoundingClientRect().height > 0).map((c) => walk(c, depth + 1)) : undefined,
    };
  };
  const wrap = document.querySelector('.relative.w-full.h-full');
  return [...wrap.children].map((c) => walk(c, 0));
});
fs.writeFileSync(path.join(OUT, 'tree.json'), JSON.stringify(tree, null, 2));

const print = (n, ind = '') => {
  if (n.y > 11000) return;
  console.log(`${ind}#${n.d} <${n.tag}> y=${n.y} h=${n.h} w=${n.w} ${n.id ? '#' + n.id : ''} ${n.cls.slice(0, 90)} :: ${n.s}  ${n.t ? '«' + n.t + '»' : ''}`);
  if (n.kids) n.kids.forEach((k) => print(k, ind + '  '));
};
tree.forEach((n) => print(n));

// screenshot the page in viewport slices
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
for (let i = 0; i * 900 < H; i++) {
  await page.evaluate((yy) => window.scrollTo(0, yy), i * 900);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, 'shots', `s${String(i).padStart(2, '0')}-orig.png`) });
}
console.log('slices', Math.ceil(H / 900));
await browser.close();

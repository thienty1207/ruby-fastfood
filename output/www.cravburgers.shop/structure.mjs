// Structure extractor: section topology + per-element computed styles + content + assets.
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

// scroll through to trigger everything
const H = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < H + 2000; y += 600) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(220);
}
await page.waitForTimeout(1500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(2500);

const data = await page.evaluate(() => {
  const pick = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      cls: (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 300),
      id: el.id || undefined,
      rect: { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) },
      style: {
        display: cs.display,
        position: cs.position,
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        backgroundImage: cs.backgroundImage?.slice(0, 200),
        textTransform: cs.textTransform,
        padding: cs.padding,
        margin: cs.margin,
        gap: cs.gap,
        borderRadius: cs.borderRadius,
        flexDirection: cs.flexDirection,
        alignItems: cs.alignItems,
        justifyContent: cs.justifyContent,
        gridTemplateColumns: cs.gridTemplateColumns,
        textAlign: cs.textAlign,
        zIndex: cs.zIndex,
        transform: cs.transform === 'none' ? 'none' : 'has-transform',
        mixBlendMode: cs.mixBlendMode,
        overflow: cs.overflow,
      },
      text: (el.childElementCount === 0 ? el.textContent : '').trim().slice(0, 300) || undefined,
      src: el.getAttribute?.('src') || undefined,
      alt: el.getAttribute?.('alt') || undefined,
      href: el.getAttribute?.('href') || undefined,
    };
  };

  // walk top-level structure: body > ... find section-level containers
  const out = { body: [], order: [], imgs: [], links: [], fonts: [], svgs: [] };

  const walk = (el, depth, maxDepth) => {
    if (depth > maxDepth) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    out.order.push({ ...pick(el), depth });
    for (const c of el.children) walk(c, depth + 1, maxDepth);
  };

  const main = document.querySelector('main') || document.body;
  // Find section-level: direct children of main
  const top = [];
  const candidates = main.children;
  for (const c of candidates) {
    const r = c.getBoundingClientRect();
    top.push({ ...pick(c), scrollH: Math.round(r.height) });
  }
  out.body = top;
  out.mainHTML = main.outerHTML.length;

  document.querySelectorAll('img').forEach((i) => {
    const r = i.getBoundingClientRect();
    out.imgs.push({
      src: i.currentSrc || i.src,
      alt: i.alt,
      w: Math.round(r.width),
      h: Math.round(r.height),
      y: Math.round(r.y + window.scrollY),
      natural: `${i.naturalWidth}x${i.naturalHeight}`,
      cls: (i.className && typeof i.className === 'string' ? i.className : '').slice(0, 150),
    });
  });
  document.querySelectorAll('a').forEach((a) => {
    out.links.push({ href: a.getAttribute('href'), text: a.textContent.trim().slice(0, 80) });
  });
  document.querySelectorAll('svg').forEach((s) => {
    const r = s.getBoundingClientRect();
    out.svgs.push({ w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y + window.scrollY), cls: (typeof s.className === 'string' ? s.className : s.className.baseVal || '').slice(0, 100), html: s.outerHTML.slice(0, 400) });
  });
  // fonts
  const seen = new Set();
  document.querySelectorAll('*').forEach((e) => {
    const f = getComputedStyle(e).fontFamily;
    if (!seen.has(f)) seen.add(f);
  });
  out.fonts = [...seen];
  out.htmlClass = document.documentElement.className;
  out.bodyClass = document.body.className;
  out.scrollHeight = document.body.scrollHeight;
  return out;
});

fs.writeFileSync(path.join(OUT, 'structure.json'), JSON.stringify(data, null, 2));

// full HTML after hydration
const html = await page.content();
fs.writeFileSync(path.join(OUT, 'hydrated.html'), html);

console.log('scrollHeight', data.scrollHeight);
console.log('body children', data.body.length);
console.log('imgs', data.imgs.length, 'svgs', data.svgs.length);
console.log('\n=== TOP LEVEL ===');
for (const b of data.body) {
  console.log(`${b.tag} ${b.cls.slice(0, 110)} | y=${b.rect.y} h=${b.rect.h} | ${b.style.position} | ${b.style.backgroundColor} | ${JSON.stringify(b.text || '').slice(0, 80)}`);
}
await browser.close();

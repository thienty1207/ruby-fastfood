// Download the site's own assets: CSS, JS chunks, images, fonts. Record everything.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL = 'https://www.cravburgers.shop/';
const OUT = process.cwd();
const DL = path.join(OUT, 'downloads');
fs.mkdirSync(DL, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const requests = [];
page.on('response', async (r) => {
  const u = r.url();
  if (!u.startsWith('https://www.cravburgers.shop/')) return;
  requests.push({ url: u, status: r.status(), type: r.request().resourceType(), len: r.headers()['content-length'] });
});
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(5000);
const H = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < H + 2000; y += 600) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(180);
}
await page.waitForTimeout(2000);

fs.writeFileSync(path.join(OUT, 'requests.json'), JSON.stringify(requests, null, 2));

// Collect stylesheet contents + cssom rules
const css = await page.evaluate(() => {
  const out = [];
  for (const sheet of document.styleSheets) {
    let rules = null;
    try {
      rules = [...sheet.cssRules].map((r) => r.cssText).join('\n');
    } catch (e) {
      rules = null;
    }
    out.push({ href: sheet.href, owner: sheet.ownerNode?.tagName, hasRules: !!rules, length: rules ? rules.length : 0, text: rules });
  }
  return out;
});
fs.writeFileSync(path.join(OUT, 'css-inlined.json'), JSON.stringify(css.map((c) => ({ href: c.href, owner: c.owner, length: c.length })), null, 2));
let all = '';
for (const c of css) {
  if (c.text) all += `\n/* ==== ${c.href || c.owner} ==== */\n${c.text}\n`;
}
fs.writeFileSync(path.join(OUT, 'css', 'all.css').replace(/css\\all/, 'all.css'), all);
fs.writeFileSync(path.join(OUT, 'all.css'), all);
console.log('css total', all.length, 'sheets', css.length);

// full hydrated html
fs.writeFileSync(path.join(OUT, 'hydrated.html'), await page.content());

// ---- portal/extraction of section HTML for the clone ----
const sections = await page.evaluate(() => {
  const g = (sel) => document.querySelector(sel)?.outerHTML || null;
  return {
    cursorLayer: g('.fixed.inset-0.w-full.h-dvh'),
    menuOverlay: g('.fixed.inset-0.z-998'),
    nav: g('nav'),
    hero: g('#hero'),
    about: g('#about'),
    experience: g('.h-fit.-mt-\\[15vw\\]') || g('.relative.w-full.h-full > div:nth-child(4)'),
    mapDesktop: g('#map-desktop'),
    mapMobile: g('#map-mobile'),
    cta: g('#cta'),
    cookie: g('.pointer-events-auto') ? document.querySelector('.fixed.bottom-\\[2vw\\]')?.outerHTML : null,
    footer: [...document.querySelectorAll('footer')].map((f) => f.outerHTML),
    bodyChildren: [...document.querySelector('.relative.w-full.h-full').children].map((c) => c.tagName + '.' + (typeof c.className === 'string' ? c.className.slice(0, 60) : '')),
  };
});
fs.writeFileSync(path.join(OUT, 'sections.json'), JSON.stringify(sections, null, 2));
await browser.close();

// ---- download every same-origin asset ----
const cache = new Map();
async function dl(u, sub) {
  const p = new globalThis.URL(u).pathname;
  let pp = p.replace(/^\/+/, ''); if (!pp || pp.endsWith('/')) pp += 'index.html'; const dest = path.join(DL, sub, pp);
  if (cache.has(dest)) return;
  cache.set(dest, 1);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0', referer: URL } });
    if (!r.ok) { console.log('MISS', r.status, u); return; }
    fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  } catch (e) { console.log('ERR', u, e.message); }
}

const urls = new Set();
for (const r of requests) urls.add(r.url.split('?')[0]);
// images referenced in html/css
const html = fs.readFileSync(path.join(OUT, 'hydrated.html'), 'utf8');
for (const m of html.matchAll(/\/(img|img-webp|_next\/(?:image|static\/media))\/?[^"'\s)\\?]*\.(?:png|jpe?g|webp|avif|svg|woff2?|mp4)/g)) urls.add('https://www.cravburgers.shop' + m[0]);
for (const m of all.matchAll(/url\((["']?)([^)"']+)\1\)/g)) {
  let v = m[2].trim();
  if (v.startsWith('data:')) continue;
  if (v.startsWith('/')) urls.add('https://www.cravburgers.shop' + v);
}
// next/image srcset variants (larger versions)
for (const m of html.matchAll(/\/_next\/image\?url=([^&"]+)&amp;w=(\d+)&amp;q=(\d+)/g)) {
  urls.add(`https://www.cravburgers.shop/_next/image?url=${m[1]}&w=${m[2]}&q=${m[3]}`);
}

let n = 0;
for (const u of urls) {
  const t = new globalThis.URL(u).pathname.startsWith('/_next/static/media') ? 'fonts' : 'site';
  await dl(u, t);
  n++;
}
console.log('downloaded', n, 'urls');
fs.writeFileSync(path.join(OUT, 'urls.txt'), [...urls].join('\n'));




// Fetch the exact originals + high-res next/image variants for every asset used on the page.
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.cravburgers.shop';
const OUT = path.join(process.cwd(), 'assets-raw');
fs.mkdirSync(OUT, { recursive: true });

const files = [
  ['/img-webp/about-1.webp', 'about-1.webp'],
  ['/img-webp/about-2.webp', 'about-2.webp'],
  ['/img-webp/about-3.webp', 'about-3.webp'],
  ['/img-webp/berlin.webp', 'berlin.webp'],
  ['/img-webp/london.webp', 'london.webp'],
  ['/img-webp/newyork.webp', 'newyork.webp'],
  ['/img-webp/sydney.webp', 'sydney.webp'],
  ['/img-webp/tokyo.webp', 'tokyo.webp'],
  ['/img-webp/cheese.webp', 'cheese.webp'],
  ['/img-webp/burgerH.webp', 'burgerH.webp'],
  ['/img-webp/burgerwithhands.webp', 'burgerwithhands.webp'],
  ['/img-webp/cheesyBurger.webp', 'cheesyBurger.webp'],
  ['/img-webp/cta.webp', 'cta.webp'],
  ['/img-webp/burger.webp', 'burger.webp'],
  ['/img-webp/fries.webp', 'fries.webp'],
  ['/img-webp/lettuce.webp', 'lettuce.webp'],
  ['/img-webp/meat.webp', 'meat.webp'],
  ['/img-webp/tomato.webp', 'tomato.webp'],
  ['/img-webp/cheese-logo.webp', 'cheese-logo.webp'],
  ['/img-webp/spices.webp', 'spices.webp'],
  ['/img-webp/og-image.webp', 'og-image.webp'],
  ['/img/plane.png', 'plane.png'],
  ['/img/burger-boy.png', 'burger-boy.png'],
  ['/img/burgerselfie.png', 'burgerselfie.png'],
];

for (const [src, name] of files) {
  try {
    const r = await fetch(BASE + src, { headers: { referer: BASE + '/', 'user-agent': 'Mozilla/5.0' } });
    if (!r.ok) { console.log('MISS', r.status, src); continue; }
    const b = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(path.join(OUT, name), b);
    console.log('ok', name, b.length);
  } catch (e) { console.log('ERR', src, e.message); }
}

// higher-res next/image renditions (w=2048) for the hero + big photos
const big = ['/img-webp/burgerH.webp', '/img-webp/cheesyBurger.webp', '/img-webp/cta.webp', '/img-webp/burgerwithhands.webp'];
for (const src of big) {
  const u = `${BASE}/_next/image?url=${encodeURIComponent(src)}&w=2048&q=90`;
  try {
    const r = await fetch(u, { headers: { referer: BASE + '/', 'user-agent': 'Mozilla/5.0' } });
    if (!r.ok) { console.log('MISS2', r.status, src); continue; }
    const b = Buffer.from(await r.arrayBuffer());
    const n = src.split('/').pop().replace('.webp', `-2048.webp`);
    fs.writeFileSync(path.join(OUT, n), b);
    console.log('ok', n, b.length);
  } catch (e) { console.log('ERR2', src, e.message); }
}

// sticker SVGs / logos in the DOM
const html = fs.readFileSync(path.join(process.cwd(), 'hydrated.html'), 'utf8');
const inlineSvgs = [...html.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((m) => m[0]);
fs.writeFileSync(path.join(process.cwd(), 'inline-svgs.json'), JSON.stringify(inlineSvgs, null, 2));
console.log('inline svgs', inlineSvgs.length);

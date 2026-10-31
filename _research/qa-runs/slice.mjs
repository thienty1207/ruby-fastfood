// Print readable slices of each chunk around tell-tale config markers.
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'downloads', 'site', '_next', 'static', 'chunks');
const OUT = path.join(process.cwd(), 'js-src');
fs.mkdirSync(OUT, { recursive: true });

const marks = {
  hero: ['sectionId:"hero"', '#hero', 'THE BURGER', 'burgerH'],
  about: ['sectionId:"about"', 'TOP CLASSIC', 'media-item'],
  ingredients: ['sectionId:"ingredients"', 'Every Layer', 'PURE QUALITY', 'factors'],
  experience: ['EXPERIENCE', 'FEEL THE CHANGE', 'juggle', 'lane'],
  map: ['take away', 'TAKE AWAY', 'TRAVELS WITH YOU', 'berlin', 'BERLIN'],
  cta: ['FEEL IT', 'sectionId:"cta"', 'cta.webp'],
  sticker: ['sticker', 'peel', '--sticker'],
  cursor: ['cursor', 'quickTo', 'quickSetter'],
  nav: ['main-menu', 'BURGERS', 'menuOpen', 'MENU'],
  lenis: ['lenis', 'Lenis', 'lerp', 'duration:1'],
  split: ['SplitText', 'splitText', 'chars', 'words', 'lines'],
  reveal: ['scrollTrigger', 'toggleActions', 'once', 'onEnter'],
};

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.js'));
const index = {};
for (const f of files) {
  const c = fs.readFileSync(path.join(DIR, f), 'utf8');
  const hits = [];
  for (const [k, pats] of Object.entries(marks)) {
    for (const p of pats) if (c.includes(p)) hits.push(k);
  }
  if (hits.length) index[f] = [...new Set(hits)];
}
console.log(JSON.stringify(index, null, 2));

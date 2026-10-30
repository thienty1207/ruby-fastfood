// Turn the captured post-hydration markup into clean static HTML:
// - rewrite next/image srcset/src to local files
// - drop hydration-only wrappers and runtime inline styles
// - keep the site's class strings verbatim (that's what makes it pixel-exact)
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.cwd();
const data = JSON.parse(fs.readFileSync(path.join(OUT, 'live-sections.json'), 'utf8'));

const HTML = (s) => s || '';

function clean(html) {
  let h = HTML(html);

  // ---- next/image -> plain local img ----
  h = h.replace(/<img([^>]*?)srcSet="[^"]*"\s*/g, '<img$1');
  h = h.replace(/<img([^>]*?)srcset="[^"]*"\s*/g, '<img$1');
  h = h.replace(/(<img[^>]*?)src="\/_next\/image\?url=([^&"]+)[^"]*"/g, (_m, a, u) => {
    return `${a}src="${decodeURIComponent(u)}"`;
  });
  h = h.replace(/\sdata-nimg="[^"]*"/g, '');
  h = h.replace(/\sdecoding="async"/g, '');
  h = h.replace(/\sloading="lazy"/g, '');
  h = h.replace(/\sstyle="color:transparent"/g, '');

  // ---- strip runtime inline styles that GSAP wrote (we re-animate) ----
  // keep only styles that are design intent (sticker vars, explicit sizes), drop transforms/opacity
  h = h.replace(/\sstyle="([^"]*)"/g, (m, css) => {
    const keep = css
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter(
        (s) =>
          !/^(translate|rotate|scale|transform|transform-origin|opacity|visibility|will-change|z-index|position|display|text-align|overflow|left|top|bottom|right|width|height|max-width|max-height|border-radius|cursor|pointer-events|user-select|backdrop-filter)\s*:/.test(
            s,
          ) &&
          !s.startsWith('--sticker-peelback') &&
          !s.startsWith('--sticker-peel-easing') &&
          !s.startsWith('--sticker-peel-hover-easing'),
      );
    return keep.length ? ` style="${keep.join('; ')}"` : '';
  });

  // ---- drop hydration-only attributes ----
  h = h.replace(/\saria-hidden="(true|false)"/g, '');
  h = h.replace(/\stabIndex="[^"]*"/g, '');
  h = h.replace(/<!-- -->/g, '');
  h = h.replace(/\sdata-pop="true"/g, '');
  h = h.replace(/\sdata-anm-btn="[^"]*"/g, '');
  h = h.replace(/\sdata-wf--btn-blob--variant="[^"]*"/g, '');
  h = h.replace(/\stype="link-btn"/g, '');
  h = h.replace(/\sdraggable="false"/g, ' draggable="false"');

  // ---- collapse whitespace in class="" lists ----
  h = h.replace(/class="([^"]*)"/g, (_m, c) => `class="${c.replace(/\s+/g, ' ').trim()}"`);

  // ---- strip pretty-printed whitespace INSIDE class strings only; keep text ----
  h = h.replace(/\s+>/g, '>');
  return h;
}

// split-text spans: the captured DOM has the *animated* wrappers. Replace each
// TextReveal instance with a clean data-split marker the JS re-splits.
function desplit(h) {
  // <span class="sr-only">TEXT</span><span aria-hidden="true" class="">...parts...</span>
  const re =
    /<span class="sr-only">([\s\S]*?)<\/span><span class=""[^>]*>[\s\S]*?<\/span>/g;
  return h.replace(re, (_m, txt) => {
    return `<span class="sr-only">${txt}</span><span data-split-body></span>`;
  });
}

// The hero/about/etc. split text uses <span class="sr-only"> then a bare
// <span> (not class="") — handle that shape too.
function desplit2(h) {
  const re = /<span class="sr-only">([\s\S]*?)<\/span>\s*<span[\s>][\s\S]*?(?=<\/h[12]>|<\/p>|<\/div>)/g;
  return h;
}

const kids = data.kids;
const byId = (id) => kids.find((k) => k.id === id);
const byIdx = (i) => kids.find((k) => k.i === i);

let out = '';

for (const k of kids) {
  let h = clean(k.html);
  h = desplit(h);
  if (k.i === 0) h = h.replace('class="fixed max-md:hidden inset-0 pointer-events-none"', 'class="fixed max-md:hidden inset-0 pointer-events-none" data-cursor-layer');
  out += h + '\n';
}

fs.writeFileSync(path.join(OUT, 'build', 'sections.html'), out);
console.log('wrote sections.html', out.length);

// also write each section separately for inspection
fs.mkdirSync(path.join(OUT, 'build', 'clean'), { recursive: true });
for (const k of kids) {
  const name = (k.id || ['cursor', 'overlay', 'nav', 'hero', 'about', 'experience', 'photoband', 'ingredients', 'map-desktop', 'map-mobile', 'cta', 'footer'][k.i]) + '';
  fs.writeFileSync(path.join(OUT, 'build', 'clean', `${k.i}-${name}.html`), desplit(clean(k.html)));
}
console.log('clean dir written');

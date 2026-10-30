// Extract animation config strings from the JS bundles: everything gsap-shaped.
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'downloads', 'site', '_next', 'static', 'chunks');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.js'));
const out = [];

for (const f of files) {
  const c = fs.readFileSync(path.join(DIR, f), 'utf8');
  const marks = ['stagger', 'scrollTrigger', 'scrub', 'ease:', 'duration:', 'fromTo', 'scrollTo', 'quickTo', 'SplitText', 'splitText', 'lenis', 'data-speed', 'pin:', 'start:', 'end:'];
  const found = {};
  for (const m of marks) found[m] = c.split(m).length - 1;
  if (!marks.some((m) => found[m])) continue;
  out.push({ file: f, size: c.length, ...found });
}
console.log(JSON.stringify(out, null, 2));

// dump windows around interesting keys for the biggest signal files
const focus = out.filter((o) => (o.stagger || 0) + (o.scrollTrigger || 0) > 2).map((o) => o.file);
for (const f of focus) {
  const c = fs.readFileSync(path.join(DIR, f), 'utf8');
  let idx = -1, n = 0;
  const chunks = [];
  while ((idx = c.indexOf('scrollTrigger', idx + 1)) !== -1 && n < 40) {
    chunks.push(c.slice(Math.max(0, idx - 700), idx + 700));
    n++;
  }
  if (chunks.length) fs.writeFileSync(path.join(process.cwd(), 'js-windows', `${f}.w.txt`), chunks.join('\n\n-----8<-----\n\n'));
}

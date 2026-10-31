// Why is the card scrub not moving? Measure actual geometry + timeline progress.
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));

await page.goto('http://127.0.0.1:5273/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3500);

const geom = await page.evaluate(() => {
  const card = document.querySelector('[data-rk-sig-card]');
  const r = card.getBoundingClientRect();
  return {
    docH: document.body.scrollHeight,
    vh: window.innerHeight,
    cardTopAbs: Math.round(r.top + window.scrollY),
    cardH: Math.round(r.height),
    // where the trigger band sits
    startPx: Math.round(r.top + window.scrollY - window.innerHeight * 0.92),
    endPx: Math.round(r.top + window.scrollY - window.innerHeight * 0.42),
  };
});
console.log('GEOMETRY:', JSON.stringify(geom, null, 2));

// does programmatic scroll actually take effect under Lenis?
await page.evaluate(() => window.scrollTo(0, 1200));
await page.waitForTimeout(700);
const after = await page.evaluate(() => Math.round(window.scrollY));
console.log(`scrollTo(1200) -> scrollY=${after}  ${after === 1200 ? 'native scroll works' : 'LENIS INTERCEPTED/DIFFERS'}`);

// sample the card state across the exact trigger band
async function sample(y) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(650);
  return page.evaluate(() => {
    const card = document.querySelector('[data-rk-sig-card]');
    const shell = card.querySelector('[data-rk-sig-shell]');
    const media = card.querySelector('[data-rk-sig-media-inner]');
    const name = card.querySelector('[data-rk-sig-el="name"]');
    const read = (el, prop) => (el ? getComputedStyle(el)[prop] : 'n/a');
    return {
      y: Math.round(window.scrollY),
      shellOp: Number(read(shell, 'opacity')).toFixed(2),
      shellTf: read(shell, 'transform'),
      mediaTf: read(media, 'transform'),
      nameOp: Number(read(name, 'opacity')).toFixed(2),
    };
  });
}

console.log('\nSAMPLES across trigger band:');
for (const y of [geom.startPx - 200, geom.startPx, Math.round((geom.startPx + geom.endPx) / 2), geom.endPx, geom.endPx + 300]) {
  if (y < 0) continue;
  const s = await sample(y);
  console.log(`  y=${String(s.y).padStart(5)} shellOp=${s.shellOp} nameOp=${s.nameOp}`);
  console.log(`         shell=${s.shellTf}`);
  console.log(`         media=${s.mediaTf}`);
}

// are the ScrollTriggers actually registered?
const stInfo = await page.evaluate(() => {
  const g = window.gsap;
  const ST = window.ScrollTrigger;
  if (!g || !ST) return { gsap: !!g, ScrollTrigger: !!ST };
  return {
    gsap: true,
    ScrollTrigger: true,
    total: ST.getAll().length,
    scrubbed: ST.getAll().filter((t) => typeof t.vars.scrub !== 'undefined').length,
  };
});
console.log('\nGSAP globals:', JSON.stringify(stInfo));
await browser.close();

// CRAV — Sizzling. Local rebuild of https://www.cravburgers.shop/
//
// Assembly order mirrors the original page's DOM order:
//   cursor layer -> menu backdrop -> nav -> hero -> about -> experience ->
//   photo band -> ingredients -> map (desktop|mobile) -> cta -> footer
import './styles/site.css';

import { gsap, ScrollTrigger } from './lib/gsap';
import { initLenis, onLenisScroll } from './lib/lenis';

import { cursorMarkup, initCursor } from './components/cursor';
import { navMarkup, initNav } from './components/nav';
import { dividerMarkup, animateDivider } from './components/divider';

import { heroMarkup, initHero } from './sections/hero';
import { aboutMarkup, initAbout } from './sections/about';
import { experienceMarkup, initExperience } from './sections/experience';
import { photoBandMarkup } from './sections/photoBand';
import { ingredientsMarkup, initIngredients } from './sections/ingredients';
import { mapDesktopMarkup, initMapDesktop } from './sections/mapDesktop';
import { mapMobileMarkup, initMapMobile } from './sections/mapMobile';
import { ctaMarkup, initCta } from './sections/cta';
import { footerMarkup, initFooter } from './sections/footer';

const app = document.getElementById('app');
if (!app) throw new Error('#app not found');

app.innerHTML = `
  <div class="relative w-full h-full" data-page>
    ${cursorMarkup()}
    ${navMarkup()}
    ${heroMarkup()}
    ${aboutMarkup()}
    ${experienceMarkup()}
    ${photoBandMarkup()}
    ${ingredientsMarkup()}
    ${mapDesktopMarkup()}
    ${mapMobileMarkup()}
    ${ctaMarkup()}
    ${footerMarkup(new Date().getFullYear())}
  </div>
`;

// ---------- smooth scroll first: everything else reads Lenis ----------
initLenis();

// ---------- static chrome ----------
initCursor();
initNav();

// ---------- dividers: every host gets its own <div> placed per data attrs ----------
function mountDividers(): Array<() => void> {
  const cleanups: Array<() => void> = [];
  document.querySelectorAll<HTMLElement>('[data-divider-host]').forEach((host) => {
    const fill = host.dataset.dividerFill || '#f5e3cd';
    const flip = host.dataset.dividerFlip === '1';
    // the divider must be a direct child of the host so `absolute` sits inside it
    const wrapper = document.createElement('div');
    wrapper.innerHTML = dividerMarkup({ fill, flip });
    const node = wrapper.firstElementChild as HTMLElement;
    host.prepend(node);
    cleanups.push(animateDivider(node, flip));
  });
  return cleanups;
}
mountDividers();

// ---------- sections ----------
initHero();
initAbout();
initExperience();
initIngredients(onLenisScroll);
initMapDesktop();
initMapMobile();
initCta();
initFooter();

// ---------- stickers (about / experience / cta — all four instances) ----------
import { initAllStickers } from './components/sticker';
initAllStickers();

// ---------- keep ScrollTrigger honest while fonts/images land ----------
const refresh = () => ScrollTrigger.refresh();
if (document.fonts?.ready) document.fonts.ready.then(refresh);
window.addEventListener('load', refresh, { once: true });
window.addEventListener('resize', () => {
  clearTimeout((window as unknown as { __stTimer?: number }).__stTimer);
  (window as unknown as { __stTimer?: number }).__stTimer = window.setTimeout(refresh, 150);
});

// frames settle, then one more refresh (images change layout height)
requestAnimationFrame(() => requestAnimationFrame(refresh));

void gsap;

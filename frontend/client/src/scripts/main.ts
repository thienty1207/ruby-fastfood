// CRAV — Sizzling. Local rebuild of https://www.cravburgers.shop/
//
// MIGRATED TO ASTRO: the markup is server-rendered by the .astro section
// components. This file only wires behaviour onto the already-present DOM.
//
// Init order is load-bearing — Lenis must exist before any section reads it,
// and dividers must be mounted before ScrollTrigger.refresh() measures the page.
import '../styles/site.css';

import { ScrollTrigger } from './motion/gsap';
import { initLenis, onLenisScroll } from './motion/lenis';

import { initCursor } from './motion/cursor';
import { initNav } from './motion/nav';
import { dividerMarkup, animateDivider } from './motion/divider';
import { initAllStickers } from './motion/sticker';

import { initHero } from './sections/hero';
import { initAbout } from './sections/about';
import { initExperience } from './sections/experience';
import { initIngredients } from './sections/ingredients';
import { initMapDesktop } from './sections/mapDesktop';
import { initMapMobile } from './sections/mapMobile';
import { initCta } from './sections/cta';
import { initFooter } from './sections/footer';

function mountDividers(): void {
  document.querySelectorAll<HTMLElement>('[data-divider-host]').forEach((host) => {
    if (host.querySelector(':scope > [data-divider-mounted]')) return; // idempotent
    const fill = host.dataset.dividerFill || '#f5e3cd';
    const flip = host.dataset.dividerFlip === '1';
    const wrapper = document.createElement('div');
    wrapper.innerHTML = dividerMarkup({ fill, flip });
    const node = wrapper.firstElementChild as HTMLElement | null;
    if (!node) return;
    node.setAttribute('data-divider-mounted', '');
    host.prepend(node);
    animateDivider(node, flip);
  });
}

function boot(): void {
  // 1. smooth scroll first: everything else reads Lenis
  initLenis();

  // 2. dividers before measuring
  mountDividers();

  // 3. chrome
  initCursor();
  initNav();

  // 4. sections
  initHero();
  initAbout();
  initExperience();
  initIngredients(onLenisScroll);
  initMapDesktop();
  initMapMobile();
  initCta();
  initFooter();

  // 5. stickers (about / experience / cta — all four instances)
  initAllStickers();

  // 6. keep ScrollTrigger honest while fonts/images land
  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts?.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });
  window.addEventListener('resize', () => {
    const w = window as unknown as { __stTimer?: number };
    clearTimeout(w.__stTimer);
    w.__stTimer = window.setTimeout(refresh, 150);
  });
  requestAnimationFrame(() => requestAnimationFrame(refresh));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

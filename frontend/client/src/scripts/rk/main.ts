/**
 * Ruby Kitchen 81 — motion entry.
 *
 * BOOT ORDER IS LOAD-BEARING:
 *   1. Lenis first — every section ScrollTrigger measures against the smoothed
 *      scroll position, so the controller must exist before any trigger is
 *      created.
 *   2. Sections after — hero, signature menu, footer.
 *   3. measurement refreshes last — fonts and images change heights.
 *
 * Cleanup contract: every init returns a disposer, collected here and run on
 * `pagehide` + HMR dispose so no ScrollTrigger, timeline, ticker callback or
 * event listener can survive a re-mount.
 */
import { ScrollTrigger } from '../motion/gsap';
import { initLenis, destroyLenis } from '../motion/lenis';
import { initRubyNav } from './nav';
import { initRubyHero } from './hero';
import { initHeroMenuTransition } from './transition';
import { initSignature } from './signature';
import { initJourney } from './journey';
import { initFullMenu } from './fullmenu';

const disposers: Array<() => void> = [];
let booted = false;

function boot(): void {
  if (booted) return; // guard against a double DOMContentLoaded
  booted = true;

  // 1. scroll controller — before any ScrollTrigger exists
  initLenis();

  // 2. sections
  disposers.push(
    initRubyNav(),
    initRubyHero(),
    initHeroMenuTransition(),
    initSignature(),
    initJourney(),
    initFullMenu(),
  );

  // 3. measurement refreshes
  const refresh = () => ScrollTrigger.refresh();

  // Fonts change metrics for every heading on the page.
  if (document.fonts?.ready) document.fonts.ready.then(refresh);

  // The signature product photos are lazy; each one changes the card height
  // mid-scroll if the trigger was measured before it decoded.
  const sigImgs = [...document.querySelectorAll<HTMLImageElement>('[data-rk-sig-img]')];
  let pending = sigImgs.length;
  sigImgs.forEach((img) => {
    if (img.complete) {
      pending -= 1;
      return;
    }
    const done = () => {
      pending -= 1;
      if (pending <= 0) refresh();
    };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });
  if (pending <= 0) refresh();

  window.addEventListener('load', refresh, { once: true });

  // Resize: debounce so scrubbed timelines are not re-measured mid-gesture.
  let t: ReturnType<typeof setTimeout> | undefined;
  const onResize = () => {
    clearTimeout(t);
    t = setTimeout(refresh, 180);
  };
  window.addEventListener('resize', onResize);
  disposers.push(() => {
    clearTimeout(t);
    window.removeEventListener('resize', onResize);
  });
}

function destroy(): void {
  booted = false;
  // Sections first (they own ScrollTriggers), then the scroll controller.
  disposers.splice(0).forEach((fn) => {
    try {
      fn();
    } catch {
      /* teardown must never throw */
    }
  });
  destroyLenis();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

// HMR / navigation safety net.
window.addEventListener('pagehide', destroy, { once: true });
if (import.meta.hot) import.meta.hot.dispose(destroy);

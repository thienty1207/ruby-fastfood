/**
 * Ruby Kitchen 81 — motion entry.
 *
 * Only the sections that exist are initialised, so this file can grow as the
 * remaining sections land (menu → burgers → chicken → combos → visit → footer)
 * without touching the page shell.
 *
 * Cleanup contract: every init returns a disposer. They are collected and run
 * on `pagehide` so HMR / soft navigation cannot leave orphaned ScrollTriggers.
 */
import { ScrollTrigger } from '../motion/gsap';
import { initRubyNav } from './nav';
import { initRubyHero } from './hero';
import { initRubySections } from './sections';
import { initSignature } from './signature';

const disposers: Array<() => void> = [];

function boot(): void {
  disposers.push(initRubyNav(), initRubyHero(), initSignature(), initRubySections());

  // Fonts change metrics; refresh once everything is measured.
  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts?.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });

  // Resize: debounce so scroll-triggered tweens are not restarted mid-gesture.
  let t: ReturnType<typeof setTimeout> | undefined;
  const onResize = () => {
    clearTimeout(t);
    t = setTimeout(refresh, 180);
  };
  window.addEventListener('resize', onResize);
  disposers.push(() => window.removeEventListener('resize', onResize));
}

function destroy(): void {
  disposers.splice(0).forEach((fn) => {
    try {
      fn();
    } catch {
      /* teardown must never throw */
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

// HMR / navigation safety net.
window.addEventListener('pagehide', destroy, { once: true });
if (import.meta.hot) import.meta.hot.dispose(destroy);

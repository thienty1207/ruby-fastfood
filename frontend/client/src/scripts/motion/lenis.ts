// Lenis smooth scroll — RAF driven off gsap.ticker so ScrollTrigger stays in
// sync with the smoothed scroll position.
//
// Lifecycle contract: `initLenis()` returns BOTH the instance and a disposer.
// Calling it twice is a no-op that hands back the existing instance, so an
// accidental double-boot can never create two RAF loops fighting each other.
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';

export let lenis: Lenis | null = null;

let disposer: (() => void) | null = null;

const prefersReduced = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Start Lenis once.
 *
 * Reduced motion: Lenis is NOT created at all. Native scrolling is already
 * instantaneous, and forcing a 1.2s eased interpolation on someone who asked
 * for less motion is exactly the wrong behaviour. `isLenActive()` reports this.
 */
export function initLenis(): Lenis | null {
  if (lenis) return lenis; // idempotent — never a second instance
  if (prefersReduced()) return null;

  const instance = new Lenis({ duration: 1.2, autoRaf: false });
  lenis = instance;

  document.documentElement.classList.add('lenis');

  // Single RAF source: gsap.ticker already runs; Lenis must not start its own.
  const tick = (time: number) => instance.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  // Keep ScrollTrigger's notion of scroll in lockstep with Lenis.
  instance.on('scroll', ScrollTrigger.update);

  disposer = () => {
    gsap.ticker.remove(tick);
    instance.off('scroll', ScrollTrigger.update);
    instance.destroy();
    document.documentElement.classList.remove('lenis');
    lenis = null;
    disposer = null;
  };

  return instance;
}

/** Tear Lenis down: removes the ticker callback and destroys the instance. */
export function destroyLenis(): void {
  disposer?.();
}

/** True only when a live Lenis instance is driving the scroll. */
export function isLenisActive(): boolean {
  return lenis !== null;
}

/** Subscribe to Lenis scroll progress. No-op when Lenis is not running. */
export function onLenisScroll(cb: (scroll: number) => void): void {
  lenis?.on('scroll', ({ scroll }: { scroll: number }) => cb(scroll));
}

export function stopLenis(): void {
  lenis?.stop();
}

export function startLenis(): void {
  lenis?.start();
}

/**
 * Scroll to an element.
 *
 * MUST go through Lenis when it is active — calling window.scrollTo or GSAP's
 * scrollTo at the same time fights the RAF loop and produces a stutter or a
 * snap-back. When Lenis is not running (reduced motion) we fall back to a
 * native scroll with `scroll-margin`/`scroll-padding` handling the nav offset.
 */
export function scrollToEl(el: Element, offset = 0): void {
  const top = el.getBoundingClientRect().top + window.scrollY - offset;

  if (lenis) {
    lenis.scrollTo(top, { duration: 1.1, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
    return;
  }

  window.scrollTo({
    top,
    behavior: prefersReduced() ? 'auto' : 'smooth',
  });
}

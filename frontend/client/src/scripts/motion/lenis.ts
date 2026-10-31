// Lenis smooth scroll — exact original config: duration 1.2, autoRaf false,
// RAF loop driven off gsap.ticker (so ScrollTrigger stays in sync).
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';

export let lenis: Lenis | null = null;

export function initLenis(): Lenis {
  const instance = new Lenis({ duration: 1.2, autoRaf: false });
  lenis = instance;

  document.documentElement.classList.add('lenis');

  const tick = (time: number) => instance.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  instance.on('scroll', ScrollTrigger.update);

  return instance;
}

/** Subscribe to Lenis scroll progress (mirrors the original's useLenis callbacks). */
export function onLenisScroll(cb: (scroll: number) => void): void {
  lenis?.on('scroll', ({ scroll }: { scroll: number }) => cb(scroll));
}

export function stopLenis(): void {
  lenis?.stop();
}

export function startLenis(): void {
  lenis?.start();
}

export function scrollToEl(el: Element, offset: number): void {
  gsap.to(window, {
    duration: 0.9,
    ease: 'power3.inOut',
    scrollTo: { y: el as HTMLElement, offsetY: offset },
  });
}
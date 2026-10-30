// The wavy section divider — animated SVG path.
// Port of chunk 014r2tef6u366.js › module 36507.
//
// The path `d` is rewritten on every tick from six tweened coordinates. Two
// independent motions:
//   1. a forever yoyo timeline breathing the control points (repeat:-1, yoyo:true)
//   2. a scroll-scrubbed scaleY on the whole svg (1 -> 1.5 desktop, 1.2 mobile)
import { gsap, ScrollTrigger } from '../lib/gsap';

export interface DividerOptions {
  fill?: string;
  flip?: boolean;
  className?: string;
}

const DESKTOP = { v: 135, s1c: 65, s1e: 155, s2c: 105, s2e: 137, s3c: 105, s3e: 105 };
const FLIPPED = { v: 165, s1c: 235, s1e: 145, s2c: 195, s2e: 163, s3c: 195, s3e: 195 };

function buildPath(p: typeof DESKTOP, flip: boolean): string {
  return flip
    ? `M1536,300 H-1 V${300 - p.v} S184.32,${300 - p.s1c} 460.8,${300 - p.s1e} S860.16,${
        300 - p.s2c
      } 1121.28,${300 - p.s2e} S1413.12,${300 - p.s3c} 1536,${300 - p.s3e} V300`
    : `M1536,0 H-1 V${p.v} S184.32,${p.s1c} 460.8,${p.s1e} S860.16,${p.s2c} 1121.28,${
        p.s2e
      } S1413.12,${p.s3c} 1536,${p.s3e} V0`;
}

/**
 * Render the divider markup.
 * The wrapper class list is the original's, including the max-md offsets.
 */
export function dividerMarkup({ fill = '#f5e3cd', flip = false, className = '' }: DividerOptions): string {
  const p = flip ? FLIPPED : DESKTOP;
  return `<div class="z-99 w-full absolute left-0 right-0 overflow-x-clip max-md:left-0 max-md:right-0 ${
    flip ? 'bottom-[-.5vw] max-md:bottom-0 max-md:!bottom-[-7vw]' : 'top-0'
  } ${className}">
    <svg class="jelly pointer-events-none block w-full max-w-[100vw] h-[300px] max-md:h-auto" width="100%" viewBox="0 0 1536 300" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true">
      <path d="${buildPath(p, flip)}" fill="${fill}"></path>
    </svg>
  </div>`;
}

/** Animate every `.jelly` inside `root` (original mounts one Divider per call). */
export function animateDivider(root: HTMLElement, flip: boolean): () => void {
  const path = root.querySelector<SVGPathElement>('.jelly path');
  const svg = root.querySelector<SVGSVGElement>('.jelly');
  if (!path) return () => {};

  const p = flip ? { ...FLIPPED } : { ...DESKTOP };
  const write = () => path.setAttribute('d', buildPath(p, flip));

  const tl = gsap.timeline({ repeat: -1, yoyo: true });

  if (flip) {
    tl.to(p, { v: 145, s1c: 215, s1e: 155, duration: 1, ease: 'sine.inOut', onUpdate: write }, 0)
      .to(p, { s2c: 175, s2e: 140, duration: 2, ease: 'sine.inOut', onUpdate: write }, 0.3)
      .to(p, { s3c: 170, s3e: 200, duration: 1.8, ease: 'sine.inOut', onUpdate: write }, 0.6);
  } else {
    tl.to(p, { v: 155, s1c: 45, s1e: 175, duration: 1, ease: 'sine.inOut', onUpdate: write }, 0)
      .to(p, { s2c: 85, s2e: 160, duration: 2, ease: 'sine.inOut', onUpdate: write }, 0.3)
      .to(p, { s3c: 130, s3e: 80, duration: 1.8, ease: 'sine.inOut', onUpdate: write }, 0.6);
  }

  const mt = gsap.matchMedia();
  if (svg) {
    gsap.set(svg, { transformOrigin: flip ? 'bottom center' : 'top center' });
    mt.add('(min-width: 768px)', () =>
      gsap.to(svg, {
        scaleY: 1.5,
        scrollTrigger: {
          trigger: svg,
          start: flip ? 'bottom 80%' : 'top 80%',
          end: flip ? 'top 20%' : 'bottom 20%',
          scrub: 1,
        },
      }),
    );
    mt.add('(max-width: 767px)', () =>
      gsap.to(svg, {
        scaleY: 1.2,
        scrollTrigger: {
          trigger: svg,
          start: flip ? 'bottom 95%' : 'top 90%',
          end: flip ? 'top 15%' : 'bottom 10%',
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      }),
    );
  }

  return () => {
    tl.kill();
    mt.revert();
  };
}

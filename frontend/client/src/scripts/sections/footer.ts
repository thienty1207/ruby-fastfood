// Footer — juggling ingredients + "CRAV" char reveal + underline draw.
// Port of chunk 014r2tef6u366.js › module 97713.
//
// CONFIRMED desktop config: restVH 22, apex [38,60], driftStart [2,7],
// driftEnd [8,24], upDur [.9,1.3], gravityRatio [1.15,1.5], spin [220,600],
// repeatDelay [.2,.9], staggerStart .55, sizeScale 1.
// Mobile: restVH 8, apex [12,18], driftStart [1,3], driftEnd [5,10],
// upDur [.7,.95], gravityRatio [1.08,1.18], spin [80,180], repeatDelay [.12,.38],
// staggerStart .4, sizeScale 1.29.
//
// Timeline per item:
//   .to(opacity 1, scale 1, .18s power1.out, 0)
//   .to(y: -apex vh, dur: upDur, power2.out, 0)
//   .to(y: restVH vh, dur: upDur*gravityRatio, power2.in, upDur)
//   .to(x: drift vw, dur: upDur+fall, sine.inOut, 0)
//   .to(rotation: ±spin, same dur, ease none, 0)
//   .to(opacity 0, .25s power1.in, total-.25)
//   onComplete → delayedCall(repeatDelay) → restart
import { gsap } from '../motion/gsap';
import { buildSplitMarkup, revealSplit } from '../motion/splitText';
import { revealLines } from '../motion/linesReveal';
import { rolling } from '../motion/ui';

const JUGGLE = [
  { src: '/img-webp/lettuce.webp', size: 11, lane: 12 },
  { src: '/img-webp/tomato.webp', size: 9, lane: 34 },
  { src: '/img-webp/cheese-logo.webp', size: 12, lane: 56 },
  { src: '/img-webp/meat.webp', size: 13, lane: 80 },
];

const FOOTER_NAV = [
  { label: 'Home', href: '/' },
  { label: 'Burgers', href: '/menu' },
  { label: 'Spices', href: '/spices' },
  { label: 'Contact', href: '/contact' },
];

const CFG = {
  desktop: { restVH: 22, apex: [38, 60], driftStart: [2, 7], driftEnd: [8, 24], upDur: [0.9, 1.3], gravityRatio: [1.15, 1.5], spin: [220, 600], repeatDelay: [0.2, 0.9], staggerStart: 0.55, sizeScale: 1 },
  mobile: { restVH: 8, apex: [12, 18], driftStart: [1, 3], driftEnd: [5, 10], upDur: [0.7, 0.95], gravityRatio: [1.08, 1.18], spin: [80, 180], repeatDelay: [0.12, 0.38], staggerStart: 0.4, sizeScale: 1.29 },
} as const;

export function footerMarkup(year: number): string {
  return `
  <footer class="h-fit w-full overflow-hidden self relative" style="--juggle-scale:1">
    <div class="relative z-30 flex items-center justify-between gap-[2vw] pb-[1vw] max-md:flex-col max-md:items-center max-md:gap-[4vw] max-md:pb-[6vw]">
      <nav class="flex flex-wrap items-center gap-x-[2vw] gap-y-[.6vw] max-md:gap-x-[5vw] max-md:gap-y-[2vw]" aria-label="Footer navigation">
        ${FOOTER_NAV.map(
          (n) =>
            `<a class="text40 uppercase font-mouse-memoirs hover:text-red transition-colors" aria-label="${n.label}" href="${n.href}">${rolling(
              n.label,
            )}</a>`,
        ).join('')}
      </nav>
      <span class="text40 max-md:hidden uppercase opacity-80 font-mouse-memoirs" data-lines data-delay=".25">© ${year} CRAV — All rights reserved</span>
    </div>

    <div class="relative z-30 max-md:hidden" data-line-draw-wrap>
      <div data-line-draw class="h-[2px] w-full bg-black/20"></div>
    </div>

    <div class="relative z-30 max-md:hidden pt-[1vw] opacity-80 max-md:pt-[4vw]">
      <p class="text40 uppercase font-mouse-memoirs" data-lines data-delay=".25">Smashed patties · toasted buns · est. 1997</p>
    </div>

    <div class="mt-[10vw] relative min-h-[18vw] max-md:mt-[5vw]">
      <div class="pointer-events-none absolute inset-x-0 bottom-0 h-0 z-20" aria-hidden="true">
        ${JUGGLE.map(
          (j) =>
            `<img data-juggle src="${j.src}" alt="" draggable="false" style="position:absolute;bottom:0;left:${j.lane}%;width:calc(${j.size}vw * var(--juggle-scale, 1));opacity:0;user-select:none;will-change:transform, opacity">`,
        ).join('')}
      </div>
      <h2 class="heading600 leading-[.5] translate-y-[5vw] max-md:translate-y-0 text-center text-red text-stroke z-10 relative" data-split="chars">${buildSplitMarkup(
        'CRAV',
        'chars',
      )}</h2>

      <div class="relative hidden max-md:block z-30 mt-[10vw]" data-line-draw-wrap>
        <div data-line-draw class="h-[2px] w-full bg-black/20"></div>
      </div>

      <div class="relative z-30 pt-[1vw] max-md:pt-[4vw]">
        <p class="text40 uppercase font-mouse-memoirs opacity-80 text-center"><span class="inline-block" data-lines><span class="hidden max-md:block">Smashed patties · toasted buns · est. 1997</span></span>
        <span class="inline-block" data-lines><span class="md:hidden block">© ${year} CRAV — All rights reserved</span></span></p>
      </div>
    </div>
  </footer>`;
}

export function initFooter(): void {
  const footer = document.querySelector<HTMLElement>('footer');
  if (!footer) return;

  // ---------- text reveals ----------
  footer.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    revealSplit(el, { split: 'chars', stagger: 0.03, duration: 0.75, ease: 'back.out(2.6)', scrollStart: 'top 92%' });
  });
  footer.querySelectorAll<HTMLElement>('[data-lines]').forEach((el, i) => {
    revealLines(el, { start: 'top 92%', delay: i === 0 ? 0 : 0.25 });
  });
  footer.querySelectorAll<HTMLElement>('[data-copyright]').forEach((el) => {
    revealLines(el, { start: 'top 92%', delay: 0.25 });
  });

  // ---------- underline draws in ----------
  footer.querySelectorAll<HTMLElement>('[data-line-draw]').forEach((line) => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      gsap.set(line, { scaleX: 1 });
      return;
    }
    gsap.set(line, { scaleX: 0, transformOrigin: '0% 50%' });
    gsap.to(line, {
      scaleX: 1,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: line, start: 'top 92%', once: true },
    });
  });

  // ---------- the juggling ingredients ----------
  const items = [...footer.querySelectorAll<HTMLImageElement>('[data-juggle]')];
  if (!items.length) return;

  const mm = gsap.matchMedia();
  mm.add(
    {
      isDesktop: '(min-width: 769px)',
      isMobile: '(max-width: 768px)',
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (ctx) => {
      const { isMobile, reduceMotion } = ctx.conditions as Record<string, boolean>;
      const cfg = isMobile ? CFG.mobile : CFG.desktop;
      footer.style.setProperty('--juggle-scale', String(cfg.sizeScale));

      const active = new Set<gsap.core.Timeline>();

      gsap.set(items, {
        xPercent: -50,
        x: 0,
        y: `${cfg.restVH}vh`,
        rotation: 0,
        opacity: 0,
        scale: 0.9,
        transformOrigin: '50% 50%',
        force3D: true,
      });

      if (reduceMotion) {
        // static, slightly-arranged fallback (matches the original's reduced path)
        const poses = isMobile
          ? [{ y: -7, x: -1, rotation: -8 }, { y: -5, x: 1, rotation: 6 }, { y: -8, x: 0, rotation: -3 }, { y: -6, x: 1, rotation: 9 }]
          : [{ y: -14, x: -2, rotation: -10 }, { y: -10, x: 1, rotation: 8 }, { y: -16, x: -1, rotation: -4 }, { y: -12, x: 2, rotation: 12 }];
        items.forEach((el, i) => {
          const p = poses[i] || poses[poses.length - 1];
          gsap.fromTo(
            el,
            { x: `${p.x}vw`, y: `${0.5 * p.y}vh`, rotation: p.rotation, opacity: 0, scale: 0.85 },
            { x: `${p.x}vw`, y: `${p.y}vh`, rotation: p.rotation, opacity: 1, scale: 1, duration: 0.7, delay: 0.12 * i, ease: 'power2.out' },
          );
        });
        return;
      }

      const launch = (el: HTMLImageElement) => {
        const apex = gsap.utils.random(cfg.apex[0], cfg.apex[1]);
        const dir = Math.random() > 0.5 ? 1 : -1;
        const driftFrom = -(gsap.utils.random(cfg.driftStart[0], cfg.driftStart[1]) * dir);
        const driftTo = gsap.utils.random(cfg.driftEnd[0], cfg.driftEnd[1]) * dir;
        const upDur = gsap.utils.random(cfg.upDur[0], cfg.upDur[1]);
        const fallDur = upDur * gsap.utils.random(cfg.gravityRatio[0], cfg.gravityRatio[1]);
        const total = upDur + fallDur;
        const spin = gsap.utils.random(cfg.spin[0], cfg.spin[1]) * (Math.random() > 0.5 ? 1 : -1);
        const gap = gsap.utils.random(cfg.repeatDelay[0], cfg.repeatDelay[1]);

        gsap.set(el, {
          x: `${driftFrom}vw`,
          y: `${cfg.restVH}vh`,
          rotation: 0,
          opacity: 0,
          scale: 0.9,
        });

        const tl = gsap.timeline({
          defaults: { overwrite: 'auto' },
          onComplete: () => {
            active.delete(tl);
            gsap.delayedCall(gap, () => launch(el));
          },
        });
        active.add(tl);

        tl.to(el, { opacity: 1, scale: 1, duration: 0.18, ease: 'power1.out' }, 0)
          .to(el, { y: `${-apex}vh`, duration: upDur, ease: 'power2.out' }, 0)
          .to(el, { y: `${cfg.restVH}vh`, duration: fallDur, ease: 'power2.in' }, upDur)
          .to(el, { x: `${driftTo}vw`, duration: total, ease: 'sine.inOut' }, 0)
          .to(el, { rotation: spin, duration: total, ease: 'none' }, 0)
          .to(el, { opacity: 0, duration: 0.25, ease: 'power1.in' }, total - 0.25);
      };

      items.forEach((el, i) => {
        const delay = i * cfg.staggerStart + gsap.utils.random(0, 0.4);
        gsap.delayedCall(delay, () => launch(el));
      });

      // pause when the tab is hidden (original does exactly this)
      const onVisibility = () => {
        active.forEach((tl) => (document.hidden ? tl.pause() : tl.play()));
      };
      document.addEventListener('visibilitychange', onVisibility);

      return () => {
        document.removeEventListener('visibilitychange', onVisibility);
        active.forEach((tl) => tl.kill());
        active.clear();
      };
    },
  );
}
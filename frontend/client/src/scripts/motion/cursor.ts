// Food-rope custom cursor — port of chunk 15b1_xl_2nu.v.js.
//
// CONFIRMED config: segmentCount 8, segmentLength 8, knots [0,3,5,9],
// icons [lettuce, tomato, cheese-logo, meat]; segment 0 quickTo pointer at
// .05s power2.out, each subsequent segment clamped to segmentLength from its
// predecessor with duration .12 + .01*r power3.out.
import { gsap } from './gsap';

const ICONS = [
  { src: '/img-webp/lettuce.webp', alt: 'lettuce' },
  { src: '/img-webp/tomato.webp', alt: 'tomato' },
  { src: '/img-webp/cheese-logo.webp', alt: 'cheese' },
  { src: '/img-webp/meat.webp', alt: 'patty' },
];

const SEGMENTS = 8;
const SEGMENT_LENGTH = 8;
const KNOTS = [0, 3, 5, 9];

export function cursorMarkup(): string {
  return `<div data-cursor-layer class="fixed max-md:hidden inset-0 pointer-events-none" style="opacity:0;z-index:10000">
    <svg class="absolute inset-0 h-full w-full" aria-hidden="true">
      <path data-cursor-path fill="none" stroke="var(--cream)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="1"></path>
    </svg>
    ${ICONS.map(
      (ic, i) => `<div data-cursor-knot="${i}" class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2" style="opacity:0;z-index:${10000 - i}">
        <div class="size-[2.2vw] max-md:hidden max-md:size-[7vw] rounded-full bg-white/80 backdrop-blur-md border border-black/20 grid place-items-center">
          <img alt="${ic.alt}" draggable="false" class="w-[70%] h-[70%] object-contain select-none" src="${ic.src}">
        </div>
      </div>`,
    ).join('')}
  </div>`;
}

export function initCursor(): void {
  const fine = window.matchMedia?.('(pointer: fine)')?.matches ?? false;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const layer = document.querySelector<HTMLElement>('[data-cursor-layer]');
  const path = document.querySelector<SVGPathElement>('[data-cursor-path]');
  const knots = [...document.querySelectorAll<HTMLElement>('[data-cursor-knot]')];
  if (!layer || !path || !fine || reduced || knots.length !== ICONS.length) return;

  // One proxy per segment; segment 0 is the one that chases the pointer.
  const segs = Array.from({ length: SEGMENTS }, () => ({ x: -200, y: -200 }));
  const lengthProxy = { value: SEGMENT_LENGTH };

  let started = false;
  let pointer = { x: -200, y: -200 };
  let hiddenByTarget = false;
  let fade = { value: 0 };

  const setOpacity = () => {
    const o = fade.value;
    layer.style.opacity = String(o);
    knots.forEach((k) => (k.style.opacity = String(o)));
    path.style.opacity = String(o);
  };

  // fade the whole rope in/out (original tweens `current` 0<->1 over .6s)
  const setHidden = (hide: boolean) => {
    hiddenByTarget = hide;
    gsap.to(fade, {
      value: hide ? 0 : 1,
      duration: 0.6,
      overwrite: 'auto',
      ease: 'power3.inOut',
      onUpdate: setOpacity,
    });
  };

  const onMove = (e: PointerEvent) => {
    pointer = { x: e.clientX, y: e.clientY };
    if (!started) {
      started = true;
      segs.forEach((s) => {
        s.x = e.clientX;
        s.y = e.clientY;
      });
      gsap.to(fade, { value: 1, duration: 0.6, ease: 'power3.inOut', onUpdate: setOpacity });
    }
    gsap.to(segs[0], { x: e.clientX, y: e.clientY, duration: 0.05, ease: 'power2.out', overwrite: true });
  };

  const frame = () => {
    if (started) {
      // clamp each segment to SEGMENT_LENGTH behind its predecessor
      const max = Math.max(0, lengthProxy.value);
      for (let r = 1; r < SEGMENTS; r += 1) {
        const prev = segs[r - 1];
        const cur = segs[r];
        const dx = prev.x - cur.x;
        const dy = prev.y - cur.y;
        if (Math.hypot(dx, dy) > max) {
          const ang = Math.atan2(dy, dx);
          const tx = prev.x - Math.cos(ang) * max;
          const ty = prev.y - Math.sin(ang) * max;
          gsap.to(cur, { x: tx, y: ty, duration: 0.12 + 0.01 * r, ease: 'power3.out', overwrite: true });
        }
      }

      // rebuild the quadratic path through the segments
      let d = `M ${segs[0].x} ${segs[0].y}`;
      for (let r = 1; r < SEGMENTS - 1; r += 1) {
        const mx = (segs[r].x + segs[r + 1].x) / 2;
        const my = (segs[r].y + segs[r + 1].y) / 2;
        d += ` Q ${segs[r].x} ${segs[r].y} ${mx} ${my}`;
      }
      const last = segs[SEGMENTS - 1];
      d += ` L ${last.x} ${last.y}`;
      path.setAttribute('d', d);

      // pin the icons to their knots and rotate to the segment angle
      KNOTS.forEach((knotIndex, i) => {
        const el = knots[i];
        const p = segs[Math.max(0, Math.min(SEGMENTS - 1, knotIndex))];
        if (!el || !p) return;
        gsap.set(el, { x: p.x, y: p.y });
        const prev = segs[Math.max(0, Math.min(SEGMENTS - 1, knotIndex - 1))];
        if (prev) {
          const angle = (Math.atan2(p.y - prev.y, p.x - prev.x) * 180) / Math.PI;
          gsap.set(el, { rotation: angle });
        }
      });
    }
    requestAnimationFrame(frame);
  };

  window.addEventListener('pointermove', onMove, { passive: true });

  // hide over [data-cursor-hide] targets (original toggles on the elements)
  document.querySelectorAll('[data-cursor-hide]').forEach((el) => {
    el.addEventListener('pointerenter', () => setHidden(true));
    el.addEventListener('pointerleave', () => setHidden(false));
  });

  document.addEventListener('pointerleave', () => {
    if (started && !hiddenByTarget) gsap.to(fade, { value: 0, duration: 0.3, overwrite: 'auto', onUpdate: setOpacity });
  });
  document.addEventListener('pointerenter', () => {
    if (started && !hiddenByTarget) gsap.to(fade, { value: 1, duration: 0.3, overwrite: 'auto', onUpdate: setOpacity });
  });

  requestAnimationFrame(frame);
}
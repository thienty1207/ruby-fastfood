// Peeling sticker — port of chunk 014r2tef6u366.js › module 80308.
//
// CONFIRMED: the only animated thing is ONE CSS variable.
//   scrollTrigger { trigger: <sticker wrapper>, start: "-120% 50%", end: "30% 50%", scrub: 1 }
//   tween { peel: 1 -> 0, ease: "none" } → el.style.setProperty('--peel-amount', peel)
// Everything else is the site's own CSS clip-path math plus SVG lighting filters.
//
// The original mounts this component FOUR times (CONFIRMED from the hydrated DOM,
// each instance emitting a .sticker-image + .flap-image pair):
//   about      → /img/burgerselfie.png
//   experience → /img-webp/fries.webp and /img-webp/burger.webp
//   cta        → /img/burger-boy.png
// Filter ids therefore have to be namespaced per instance, or the last-mounted
// filter silently re-lights every sticker on the page.
import { gsap } from '../lib/gsap';

export interface StickerOptions {
  imageSrc: string;
  /** --sticker-rotate, default 30deg */
  rotate?: number;
  triggers?: [string, string];
  width?: string;
  shadowIntensity?: number;
  lightingIntensity?: number;
  peelDirection?: number;
  /** extra wrapper classes (positioning) */
  className?: string;
  /** namespaces the SVG filter ids; must be unique per sticker on the page */
  id?: string;
}

const registry = new Set<string>();

function uniqueId(base: string): string {
  let id = base;
  let n = 1;
  while (registry.has(id)) id = `${base}-${n++}`;
  registry.add(id);
  return id;
}

export function stickerMarkup({
  imageSrc,
  rotate = 30,
  width = '200px',
  shadowIntensity = 0.6,
  lightingIntensity = 0.1,
  peelDirection = 0,
  className = '',
  id,
}: StickerOptions): string {
  const ns = uniqueId(id ?? 'st');
  const vars = [
    `--sticker-rotate:${rotate}deg`,
    '--sticker-p:20%',
    '--sticker-peelback-hover:30%',
    '--sticker-peelback-active:40%',
    '--sticker-peel-easing:power3.out',
    '--sticker-peel-hover-easing:power2.out',
    `--sticker-width:${width}`,
    `--sticker-shadow-opacity:${shadowIntensity}`,
    `--sticker-lighting-constant:${lightingIntensity}`,
    `--peel-direction:${peelDirection}deg`,
    '--peel-amount:1',
  ].join(';');

  // The site's CSS hard-codes url("#pointLight") etc., so we rewrite the filter
  // references on this subtree to the namespaced ids.
  return `<div data-sticker="${ns}" class="sticker-ns-${ns} ${className}" style="${vars}">
    <svg width="0" height="0">
      <defs>
        <filter id="${ns}-pointLight">
          <feGaussianBlur stdDeviation="1" result="blur"></feGaussianBlur>
          <feSpecularLighting result="spec" in="blur" specularExponent="100" specularConstant="${lightingIntensity}" lighting-color="white">
            <fePointLight data-light-main x="100" y="100" z="300"></fePointLight>
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" result="lit"></feComposite>
          <feComposite in="lit" in2="SourceAlpha" operator="in"></feComposite>
        </filter>
        <filter id="${ns}-pointLightFlipped">
          <feGaussianBlur stdDeviation="10" result="blur"></feGaussianBlur>
          <feSpecularLighting result="spec" specularExponent="100" specularConstant="${7 * lightingIntensity}" lighting-color="white">
            <fePointLight data-light-flap x="100" y="100" z="300"></fePointLight>
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" result="lit"></feComposite>
          <feComposite in="lit" in2="SourceAlpha" operator="in"></feComposite>
        </filter>
        <filter id="${ns}-dropShadow">
          <feDropShadow dx="2" dy="4" stdDeviation="${3 * shadowIntensity}" flood-color="black" flood-opacity="${shadowIntensity}"></feDropShadow>
        </filter>
        <filter id="${ns}-expandAndFill">
          <feOffset dx="0" dy="0" in="SourceAlpha" result="shape"></feOffset>
          <feFlood flood-color="rgb(179,179,179)" result="flood"></feFlood>
          <feComposite operator="in" in="flood" in2="shape"></feComposite>
        </filter>
      </defs>
    </svg>
    <div class="sticker-container">
      <div class="sticker-main" style="filter:url(#${ns}-dropShadow)">
        <div class="sticker-lighting" style="filter:url(#${ns}-pointLight)">
          <img src="${imageSrc}" alt="" class="sticker-image" draggable="false">
        </div>
      </div>
      <div class="flap">
        <div class="flap-lighting" style="filter:url(#${ns}-pointLightFlipped)">
          <img src="${imageSrc}" alt="" class="flap-image" style="filter:url(#${ns}-expandAndFill)" draggable="false">
        </div>
      </div>
    </div>
  </div>`;
}

/** Wire the peel + the cursor-tracked point lights for one sticker. */
export function initSticker(root: HTMLElement, triggers: [string, string] = ['-120% 50%', '30% 50%']): void {
  const container = root.querySelector<HTMLElement>('.sticker-container');
  const lightMain = root.querySelector<SVGElement>('[data-light-main]');
  const lightFlap = root.querySelector<SVGElement>('[data-light-flap]');
  const peelDirection = parseFloat(root.style.getPropertyValue('--peel-direction') || '0') || 0;

  if (!container) return;

  // ---- point lights follow the pointer (CONFIRMED: gsap.set(attr{x,y})) ----
  if (lightMain && lightFlap) {
    root.addEventListener('mousemove', (e) => {
      const r = root.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      gsap.set(lightMain, { attr: { x, y } });
      if (Math.abs(peelDirection % 360) !== 180) {
        gsap.set(lightFlap, { attr: { x, y: r.height - y } });
      } else {
        gsap.set(lightFlap, { attr: { x: -1000, y: -1000 } });
      }
    });
  }

  // ---- the peel: the trigger is the sticker wrapper itself ----
  const proxy = { peel: 1 };
  gsap.to(proxy, {
    peel: 0,
    ease: 'none',
    scrollTrigger: { trigger: container, start: triggers[0], end: triggers[1], scrub: 1 },
    onUpdate: () => container.style.setProperty('--peel-amount', String(proxy.peel)),
  });
}

/** Mount every [data-sticker] already in the DOM. */
export function initAllStickers(): void {
  document.querySelectorAll<HTMLElement>('[data-sticker]').forEach((el) => {
    initSticker(el);
  });
}

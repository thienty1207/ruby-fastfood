// Map (desktop) — the plane on the dashed route + country pins.
// Port of chunk 0c-pxnn7_5v8q.js › module 7234.
//
// CONFIRMED config:
//   shared ScrollTrigger: { trigger: <map inner>, start:"-10% top", end:"75%", scrub:1 }
//   plane: gsap.set(wrap,{xPercent:-50,yPercent:-50}); gsap.to(wrap,{
//            motionPath:{ path:<svg path>, align:<same>, alignOrigin:[.5,.5], autoRotate:-90 },
//            ease:"none", force3D:true, scrollTrigger:{...shared} })
//   pins:  progress thresholds [.14,.28,.5,.68,.91]; entering →
//            fromTo({opacity:0,scale:.8,rotate:random(±15)} → {opacity:1,scale:1.08,
//            rotate:5-10*random, duration:.45, ease:"back.out(2.2)"})
//          leaving → to({opacity:0,scale:.8,rotate:random(±15),duration:.28,ease:"back.in(1.2)"})
import { gsap, ScrollTrigger } from '../motion/gsap';
import { revealLines } from '../motion/linesReveal';

const PINS = [
  { src: '/img-webp/berlin.webp', alt: 'CRAV Burger takeaway packaging in Berlin', country: 'BERLIN', cls: 'absolute right-[5vw] space-y-[1.5vw] z-200 top-[50vw] items-end flex flex-col', noteCls: 'text-red rotate-7 text-right uppercase text-stroke-small text40 font-modak leading-[.9]! country-label' },
  { src: '/img-webp/london.webp', alt: 'CRAV Burger takeaway packaging in London', country: 'LONDON', cls: 'absolute left-[35vw] space-y-[1.5vw] z-200 top-[64vw] items-start flex flex-col', noteCls: 'text-red -rotate-7 text-left uppercase text-stroke-small text40 font-modak leading-[.9]! country-label' },
  { src: '/img-webp/newyork.webp', alt: 'CRAV Burger takeaway packaging in New York', country: 'NEW YORK', cls: 'absolute right-[20vw] space-y-[1.5vw] z-200 top-[80vw] items-end flex flex-col', noteCls: 'text-red rotate-12 text-right uppercase text-stroke-small text40 font-modak leading-[.9]! country-label' },
  { src: '/img-webp/sydney.webp', alt: 'CRAV Burger takeaway packaging in Sydney', country: 'SYDNEY', cls: 'absolute left-[15vw] space-y-[1.5vw] z-200 top-[105vw] items-start flex flex-col', noteCls: 'text-red -rotate-12 text-left uppercase text-stroke-small text40 font-modak leading-[.9]! country-label' },
  { src: '/img-webp/tokyo.webp', alt: 'CRAV Burger takeaway packaging in Tokyo', country: 'TOKYO', cls: 'absolute right-[14vw] space-y-[1.5vw] z-200 top-[130vw] items-end flex flex-col', noteCls: 'text-red rotate-6 text-right uppercase text-stroke-small text40 font-modak leading-[.9]! country-label' },
];

const ROUTE_D =
  'M500 -139C557 -139 1550.43 364.378 1610.6 653.93C1745.6 1303.59 -160.566 551.165 -11.7069 1197.36C117.259 1757.21 1470.1 925.826 1474.12 1502.33C1478.15 2080.14 63.7084 1375.34 -11.707 1896.78C-107.419 2558.55 1928.5 2042.5 1928.5 2042.5';

export function mapDesktopMarkup(): string {
  return `
  <section id="map-desktop" class="h-fit max-md:hidden overflow-hidden w-full bg-mustard relative" data-divider-host data-divider-fill="var(--bg)" data-divider-flip="0">
    <div data-map-plane class="pointer-events-none absolute left-0 top-0 w-[15vw]" style="z-index:2;backface-visibility:hidden;transform:translate3d(0,0,0)">
      <img src="/img/plane.png" alt="Plane" width="1000" height="1000" class="h-full w-full object-contain" draggable="false">
    </div>
    <div data-map-inner class="relative self h-[163vw] w-full">
      <div class="absolute top-0 left-0 h-full w-full">
        <svg class="h-full w-full object-cover" width="1728" height="2176" viewBox="0 0 1728 2176" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path data-map-route d="${ROUTE_D}" stroke="var(--gold-bright)" stroke-opacity="0.5" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="42 42"></path>
        </svg>
      </div>

      <div class="space-y-[2vw] mt-[20vw] relative z-10">
        <p class="text-mustard-dark -rotate-7 ml-[1vw] -translate-y-[6vw] uppercase text-stroke-180 text-[2.8vw] font-modak leading-[.9]!">take away</p>
        <h2 class="text-white text-stroke-180-mustard heading300 w-[80vw] leading-[.85]">QUALITY THAT TRAVELS WITH YOU</h2>
        <p class="text40 w-[30vw] ml-[1vw] text-black font-mouse-memoirs leading-[1.1]" data-lines data-delay=".25">Freshly packed smash burgers, ready to go wherever you crave. From our flat-top to any corner of the globe, we ensure every layer stays hot and juicy.</p>
      </div>

      ${PINS.map(
        (p, i) => `<div data-pin="${i}" class="${p.cls}" style="cursor:pointer;will-change:transform">
          <p data-pin-label="${i}" class="${p.noteCls}" style="will-change:transform;cursor:pointer">${p.country}˝</p>
          <div class="w-[14vw] rounded-[1vw] overflow-hidden h-[17vw]">
            <img src="${p.src}" alt="${p.alt}" width="1000" height="1000" class="h-full w-full object-cover" draggable="false">
          </div>
        </div>`,
      ).join('')}
    </div>
  </section>`;
}

export function initMapDesktop(): void {
  const section = document.querySelector<HTMLElement>('#map-desktop');
  if (!section) return;

  section.querySelectorAll<HTMLElement>('[data-lines]').forEach((el) => {
    revealLines(el, { start: 'top 95%', delay: 0.25 });
  });

  const inner = section.querySelector<HTMLElement>('[data-map-inner]');
  const route = section.querySelector<SVGPathElement>('[data-map-route]');
  const plane = section.querySelector<HTMLElement>('[data-map-plane]');
  const pins = [...section.querySelectorAll<HTMLElement>('[data-pin]')];
  const labels = [...section.querySelectorAll<HTMLElement>('[data-pin-label]')];
  if (!inner) return;

  // ---------- inertial shove on pins and labels ----------
  const attachInertia = (el: HTMLElement, vel: number, rotVel: number, resistance: number) => {
    let lastX = 0;
    let lastY = 0;
    let dx = 0;
    let dy = 0;
    const baseRotation = parseFloat(gsap.getProperty(el, 'rotation') as string) || 0;
    el.addEventListener('mousemove', (e) => {
      dx = e.clientX - lastX;
      dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    el.addEventListener('mouseenter', (e) => {
      dx = 0;
      dy = 0;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, {
        inertia: {
          x: { velocity: vel * dx, end: 0 },
          y: { velocity: vel * dy, end: 0 },
          rotation: { velocity: rotVel * dx, end: baseRotation },
          resistance,
        },
        force3D: true,
      });
    });
  };
  pins.forEach((p) => attachInertia(p, 30, 2, 140));
  labels.forEach((l) => attachInertia(l, 25, 1.5, 170));

  const shared = { trigger: inner, start: '-10% top', end: '75%', scrub: 1, invalidateOnRefresh: true };

  // ---------- pins pop in by scroll progress ----------
  const thresholds = [0.14, 0.28, 0.5, 0.68, 0.91];
  pins.forEach((p) => gsap.set(p, { opacity: 0, scale: 0.8, rotate: 0 }));
  const shown = new Array(pins.length).fill(false);

  ScrollTrigger.create({
    ...shared,
    onUpdate: (self) => {
      const t = self.progress;
      thresholds.forEach((th, i) => {
        const el = pins[i];
        if (!el) return;
        if (t >= th && !shown[i]) {
          gsap.fromTo(
            el,
            { opacity: 0, scale: 0.8, rotate: -15 + 30 * Math.random() },
            { opacity: 1, scale: 1.08, rotate: 5 - 10 * Math.random(), duration: 0.45, ease: 'back.out(2.2)', overwrite: 'auto', force3D: true },
          );
          shown[i] = true;
        } else if (t < th && shown[i]) {
          gsap.to(el, { opacity: 0, scale: 0.8, rotate: -15 + 30 * Math.random(), duration: 0.28, ease: 'back.in(1.2)', overwrite: 'auto', force3D: true });
          shown[i] = false;
        }
      });
    },
  });

  // ---------- the plane follows the dashed route ----------
  if (plane && route) {
    gsap.set(plane, { xPercent: -50, yPercent: -50 });
    gsap.to(plane, {
      motionPath: { path: route, align: route, alignOrigin: [0.5, 0.5], autoRotate: -90 },
      ease: 'none',
      force3D: true,
      scrollTrigger: { ...shared },
    });
  }

  // refresh after fonts/images settle (original does a 1s + window-load refresh)
  setTimeout(() => ScrollTrigger.refresh(), 1000);
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
// Map (mobile) — 4 planes walking a vertical dashed path in 4 segments.
// Port of chunk 0c-pxnn7_5v8q.js › module 96008.
//
// CONFIRMED: one timeline, scrub 1, scrollTrigger {start:"-2% center", end:"95% center"}.
// For each of the 4 planes at t=0..3, segmentDuration 1:
//   fromTo(plane[i], {motionPath:{path, alignOrigin:[.5,.5], autoRotate:true,
//                       start:t/4, end:t/4}},
//                    {motionPath:{... start:t/4, end:(t+1)/4}, duration:1, ease:"none"}, t*1)
//   fade in over first .2*duration, out over last .2*duration
// Cards pop in with ScrollTrigger {start:"top 70%", once:true}.
import { gsap, ScrollTrigger } from '../lib/gsap';
import { dividerMarkup } from '../components/divider';

const CARDS = [
  { src: '/img-webp/berlin.webp', alt: 'take away 1', country: 'BERLIN', note: 'Grilled to perfection juicy, smoky, unforgettable.' },
  { src: '/img-webp/london.webp', alt: 'take away 2', country: 'LONDON', note: 'Sun-ripened tomatoes that bring natural sweetness and balance.' },
  { src: '/img-webp/newyork.webp', alt: 'take away 3', country: 'NEW YORK', note: 'Rich, creamy cheese that melts into every bite.' },
  { src: '/img-webp/sydney.webp', alt: 'take away 4', country: 'SYDNEY', note: 'Grilled to perfection juicy, smoky, unforgettable.' },
  { src: '/img-webp/tokyo.webp', alt: 'take away 5', country: 'TOKYO', note: 'Soft, toasted buns crafted to hold everything together.' },
];

const PLANES = 4;
const SEGMENT_DURATION = 1;

export function mapMobileMarkup(): string {
  return `
  <section id="map-mobile" class="h-fit hidden space-y-[5vw] max-md:block relative min-h-screen w-full bg-mustard overflow-hidden" data-divider-host data-divider-fill="#F5E3CD" data-divider-flip="0">
    <div class="space-y-[4vw] mt-[30vw] relative z-10">
      <h2 class="text-white text-center w-full text-stroke-180-mustard heading300 uppercase leading-[.85]">A story in every bite.</h2>
      <p class="text40 mx-auto text-center w-[65%] text-black font-mouse-memoirs leading-[1.1]">From fresh farms to your hands every layer matters.</p>
    </div>

    <div data-mobile-path-host class="flex flex-col relative gap-[50vw] items-center mt-[25vw] pb-[10vw]">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[83%] w-[2vw] flex items-center pointer-events-none z-0">
        <svg width="6" height="100%" viewBox="0 0 6 1000" class="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="display:block">
          <path data-mobile-route d="M3 0 L3 1000" stroke="#F4A804" stroke-opacity="0.7" stroke-width="4" stroke-dasharray="10 14"></path>
        </svg>
      </div>

      ${Array.from({ length: PLANES })
        .map(
          (_, i) =>
            `<div data-plane="${i}" class="pointer-events-none absolute left-0 top-0 w-[25vw] will-change-transform" style="z-index:2">
              <img src="/img/plane.png" alt="Path — plane ${i + 1}" width="1000" height="1000" class="h-full w-full object-contain -rotate-90" draggable="false">
            </div>`,
        )
        .join('')}

      ${CARDS.map(
        (c) => `<div data-card class="flex flex-col items-center space-y-[3vw] w-fit relative z-10" style="cursor:pointer;will-change:transform">
          <p class="uppercase text-stroke-small text-[7vw] font-modak leading-snug country-label" style="will-change:transform;cursor:pointer">${c.country}</p>
          <div class="w-[60vw] rounded-[5vw] overflow-hidden h-auto mx-auto bg-white/70 shadow-lg">
            <img src="${c.src}" alt="${c.alt}" width="900" height="450" class="h-full w-full object-cover" draggable="false">
          </div>
          <p class="text-[5vw] w-[70%] text-black uppercase font-mouse-memoirs leading-[1.1] text-center px-[6vw]">${c.note}</p>
        </div>`,
      ).join('')}
    </div>
  </section>`;
}

export function initMapMobile(): void {
  const section = document.querySelector<HTMLElement>('#map-mobile');
  if (!section) return;

  // ---------- cards pop in ----------
  section.querySelectorAll<HTMLElement>('[data-card]').forEach((el) => {
    gsap.set(el, { opacity: 0, scale: 0.8, rotate: 0, y: 50 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.8, rotate: -15 + 30 * Math.random(), y: 50 },
          { opacity: 1, scale: 1.05, rotate: 3 - 6 * Math.random(), y: 0, duration: 0.45, ease: 'back.out(2.2)', overwrite: 'auto' },
        );
      },
    });
  });

  // ---------- planes walk the vertical path ----------
  const host = section.querySelector<HTMLElement>('[data-mobile-path-host]');
  const route = section.querySelector<SVGPathElement>('[data-mobile-route]');
  const planes = [...section.querySelectorAll<HTMLElement>('[data-plane]')];
  if (!host || !route || planes.length !== PLANES) return;

  planes.forEach((p) => gsap.set(p, { xPercent: -50, yPercent: -50, opacity: 0 }));

  const tl = gsap.timeline({
    scrollTrigger: { trigger: host, start: '-2% center', end: '95% center', scrub: 1 },
  });

  for (let i = 0; i < PLANES; i += 1) {
    const at = i * SEGMENT_DURATION;
    tl.fromTo(
      planes[i],
      { motionPath: { path: route, align: route, alignOrigin: [0.5, 0.5], autoRotate: true, start: i / PLANES, end: i / PLANES } },
      { motionPath: { path: route, align: route, alignOrigin: [0.5, 0.5], autoRotate: true, start: i / PLANES, end: (i + 1) / PLANES }, duration: SEGMENT_DURATION, ease: 'none' },
      at,
    );
    const fade = 0.2 * SEGMENT_DURATION;
    tl.fromTo(planes[i], { opacity: 0 }, { opacity: 1, duration: fade, ease: 'power1.inOut' }, at);
    tl.to(planes[i], { opacity: 0, duration: fade, ease: 'power1.inOut' }, at + SEGMENT_DURATION - fade);
  }
}

export { dividerMarkup };

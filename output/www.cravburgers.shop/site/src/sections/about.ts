// About — chunk 0c-pxnn7_5v8q.js › module 83052.
// Photos get an inertial shove on mouse-leave:
//   inertia { x:{velocity:30*dx,end:0}, y:{velocity:30*dy,end:0},
//             rotation:{velocity:2*dx,end:baseRotation}, resistance:150 }
// Order button morphs its blob between 4 SVG paths on hover.
import { gsap, MorphSVGPlugin } from '../lib/gsap';
import { buildSplitMarkup, revealSplit } from '../components/splitText';
import { revealLines } from '../components/linesReveal';
import { BLOB_BASE, BLOB_VARIANTS, orderButton } from '../components/ui';
import { stickerMarkup } from '../components/sticker';

void MorphSVGPlugin;

const PHOTOS = [
  { src: '/img-webp/about-1.webp', alt: 'Chef preparing a fresh smashed burger', rotate: 'md:rotate-[5deg]', extra: 'max-md:-rotate-12 max-md:translate-y-[3vw]' },
  { src: '/img-webp/about-2.webp', alt: 'Close-up of melted cheese on a burger patty', rotate: 'md:rotate-[-5deg]', extra: 'max-md:-translate-y-[6vw] max-md:z-10' },
  { src: '/img-webp/about-3.webp', alt: 'CRAV restaurant atmosphere', rotate: 'md:rotate-[8deg]', extra: 'max-md:rotate-12 max-md:translate-y-[3vw]' },
];

export function aboutMarkup(): string {
  return `
  <section id="about" class="h-fit overflow-clip self relative z-100 text-center space-y-[2vw] w-full max-md:space-y-[6vw] py-[6vw]">
    <div class="space-y-[1vw] relative max-md:space-y-[6vw]">
      <p class="text-red z-100 max-md:rotate-0 relative top-[-1vw] max-md:top-0 -rotate-5 text-stroke-180 w-full text-center mx-auto text-[2.8vw] font-modak leading-[.9]! max-md:text-[8vw] max-md:w-fit max-md:mx-auto">TOP CLASSIC</p>
      <h2 class="text-stroke-180 max-md:w-full w-[70%] text-center mx-auto leading-[.75]! text-red heading300 uppercase" data-split="words">${buildSplitMarkup(
        'juicy cheesy fully Loaded',
        'words',
      )}</h2>
      <p class="text-black text40 w-[45%] mt-[2vw] leading-[1.1] mx-auto max-md:w-[90%]" data-lines data-delay=".25">CRAV is back and bolder than ever. Honoring our rich roots, we bring you the ultimate smashed experience fully loaded, hot, and crafted fresh.</p>
    </div>

    <div class="mx-auto mt-[2vw] mb-[4vw] w-full max-md:mt-[6vw] max-md:mb-[8vw]">
      <div data-order-btn class="flex justify-center">${orderButton()}</div>
    </div>

    <div class="relative grid h-fit w-full place-items-center px-[10vw] pb-[6vw] max-md:px-[4vw] max-md:pb-[12vw]">
      <div class="absolute w-[15vw] max-md:w-[25vw] h-auto top-[-13vw] max-md:top-[-30vw] left-[5vw] max-md:-left-[4vw] z-50 drop-shadow-xl">
        ${stickerMarkup({ imageSrc: '/img/burgerselfie.png', width: '100%', id: 'about' })}
      </div>
      <div class="grid grid-cols-3 gap-[1vw] justify-center mx-auto max-w-[70vw] max-md:flex max-md:flex-row max-md:flex-nowrap max-md:items-end max-md:justify-center max-md:gap-[2vw] max-md:w-full max-md:pt-[4vw] max-md:pb-[2vw]">
        ${PHOTOS.map(
          (p) => `<div class="h-[25vw] w-[20vw] rounded-[4%] overflow-hidden media-item max-md:origin-bottom max-md:w-[35vw] max-md:h-[38vw] max-md:shrink-0 ${p.rotate} ${p.extra}" style="will-change:transform;cursor:pointer">
            <img src="${p.src}" alt="${p.alt}" width="1000" height="1000" class="h-full w-full object-cover">
          </div>`,
        ).join('')}
      </div>
    </div>
  </section>`;
}

export function initAbout(): void {
  const about = document.querySelector<HTMLElement>('#about');
  if (!about) return;

  about.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    revealSplit(el, { scrollStart: 'top 86%' });
  });
  about.querySelectorAll<HTMLElement>('[data-lines]').forEach((el) => {
    revealLines(el, { start: 'top 92%', delay: 0.25 });
  });

  // ---------- inertial photo shove ----------
  about.querySelectorAll<HTMLElement>('.media-item').forEach((el) => {
    let lastX = 0;
    let lastY = 0;
    let dx = 0;
    let dy = 0;
    const baseRotation = parseFloat(gsap.getProperty(el, 'rotation') as string) || 0;

    const onMove = (e: MouseEvent) => {
      dx = e.clientX - lastX;
      dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onEnter = (e: MouseEvent) => {
      dx = 0;
      dy = 0;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onLeave = () => {
      gsap.to(el, {
        inertia: {
          x: { velocity: 30 * dx, end: 0 },
          y: { velocity: 30 * dy, end: 0 },
          rotation: { velocity: 2 * dx, end: baseRotation },
          resistance: 150,
        },
        force3D: true,
      });
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
  });

  // ---------- blob morph on the Order button ----------
  const btn = about.querySelector<HTMLElement>('[data-order-btn] a');
  const path = btn?.querySelector<SVGPathElement>('.blob-path');
  if (btn && path) {
    let tween: gsap.core.Tween | null = null;
    btn.addEventListener('mouseenter', () => {
      const shape = BLOB_VARIANTS[Math.floor(Math.random() * BLOB_VARIANTS.length)];
      tween?.kill();
      tween = gsap.to(path, { morphSVG: { shape }, duration: 0.5, ease: 'back.out' });
    });
    btn.addEventListener('mouseleave', () => {
      tween?.kill();
      tween = gsap.to(path, { morphSVG: { shape: BLOB_BASE }, duration: 0.5, ease: 'back.in' });
    });
  }
}

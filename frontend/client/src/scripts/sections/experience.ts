// Experience — the red "FOOD THAT FEELS GOOD" block with the googly-eyed burger.
// Port of chunk 0c-pxnn7_5v8q.js › module 79948.
//
// The eyes are pure DOM: an SVG eyebrow arc + a white ellipse (borderRadius
// "50% / 60%") holding a black pupil (borderRadius "50% / 55%"). Both pupils
// rotate toward the pointer with gsap.quickSetter(el,'rotation','deg'):
//   r = atan2(clientY - innerHeight/2, clientX - innerWidth/2) * 180/PI - 180
import { gsap, ScrollTrigger } from '../motion/gsap';
import { buildSplitMarkup, revealSplit } from '../motion/splitText';
import { revealLines } from '../motion/linesReveal';
import { stickerMarkup } from '../motion/sticker';

const EYE = (side: 'left' | 'right') => {
  const isLeft = side === 'left';
  return `<div class="absolute top-[2%] ${isLeft ? 'left-[36%]' : 'right-[36%]'} ${
    isLeft ? '-translate-x-1/2' : 'translate-x-1/2'
  } z-20">
    <div class="w-[7vw] max-md:w-[14vw] mb-[.8vw] max-md:mb-[1.8vw] mx-auto flex items-center justify-center ${
      isLeft ? '' : 'scale-x-[-1]'
    }">
      <svg width="100%" viewBox="0 0 182 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.2666 74.5742C7.2666 74.5742 45.7896 11.0167 85.7666 8.57418C128.957 5.93536 174.767 74.5742 174.767 74.5742" stroke="white" stroke-width="17"></path>
      </svg>
    </div>
    <div class="bg-white flex items-center justify-center overflow-hidden mx-auto" style="width:6vw;height:9vw;max-width:12vw;max-height:18vw;border-radius:50% / 60%">
      <div class="relative bg-white" style="width:70%;height:75%;border-radius:50% / 60%">
        <div style="position:absolute;top:50%;left:50%;width:100%;height:2.2vw;max-height:4.2vw;transform:translate(-50%,-50%) rotate(0deg);transform-origin:50% 50%" data-eye="${side}">
          <div style="width:2.2vw;height:3vw;max-width:4vw;max-height:6vw;border-radius:50% / 55%;background:black"></div>
        </div>
      </div>
    </div>
  </div>`;
};

export function experienceMarkup(): string {
  return `
  <div class="h-fit -mt-[15vw] max-md:-mt-[10vw] self flex items-center justify-center relative w-full bg-red" data-divider-host data-divider-fill="#f5e3cd" data-divider-flip="0">
    <div class="h-fit relative mt-[15vw] max-md:mt-[10vw] flex flex-col items-center justify-center translate-y-[10vw] max-md:translate-y-[5vw] z-10 w-full overflow-hidden pb-[5vw] max-md:pb-[15vw]">
      <div class="w-[14vw] max-md:w-[25vw] h-auto absolute top-[5vw] max-md:top-[30vw] left-[5vw] max-md:-left-[4vw] z-50">
        ${stickerMarkup({ imageSrc: '/img-webp/fries.webp', width: '100%', id: 'exp-fries' })}
      </div>
      <div class="w-[18vw] max-md:w-[35vw] h-auto absolute top-[20vw] max-md:top-[35vw] right-[2vw] max-md:-right-[6vw] z-50">
        ${stickerMarkup({ imageSrc: '/img-webp/burger.webp', width: '100%', id: 'exp-burger' })}
      </div>

      <div class="relative z-20 w-full flex flex-col items-center">
        <p class="text-red absolute -rotate-8 max-md:rotate-0 text-stroke-180 text-center top-[5vw] max-md:top-[6vw] left-1/2 -translate-x-1/2 text-[2.8vw] max-md:text-[7vw] font-modak leading-[.9]! z-0 mix-blend-overlay opacity-80">EXPERIENCE</p>
        <h2 class="text-center heading300 uppercase max-md:text-[14vw] leading-[.75] w-full text-beige relative z-20 mt-[10vw] max-md:mt-[15vw]" data-split="words">${buildSplitMarkup(
          'food that\nfeels good',
          'words',
        )}</h2>
      </div>

      <div class="flex items-end justify-between w-full px-0 max-md:px-[4vw] max-md:flex-col max-md:items-center relative max-md:mt-[15vw]">
        <div class="max-md:absolute max-md:bottom-[-15vw] max-md:left-0 z-20 max-md:text-left">
          <p class="text-beige whitespace-nowrap font-mouse-memoirs uppercase leading-[1.1] text40 max-md:text-[6vw]" data-lines>450 kcal<br> High Protein<br> Fresh Ingredients</p>
        </div>

        <div class="h-auto translate-y-[4vw] max-md:translate-y-0 w-[80vw] max-md:w-screen relative z-10">
          ${EYE('left')}
          ${EYE('right')}
          <img src="/img-webp/burgerwithhands.webp" alt="burger with hands" width="1000" height="1000" class="h-full w-full object-contain relative z-10" data-refresh-on-load>
          <p class="text-mustard-dark absolute rotate-15 text-stroke-180 w-[10vw] max-md:w-[22vw] text-center bottom-[10vw] max-md:bottom-[10vw] right-[10vw] max-md:right-[8vw] text-[2.8vw] max-md:text-[6vw] font-modak leading-[.9]! z-30">BOLD FLAVOUR</p>
        </div>

        <div class="max-md:absolute max-md:bottom-[-15vw] max-md:right-0 z-20 max-md:text-right">
          <p class="text-beige font-mouse-memoirs uppercase leading-[1.1] text-right text40 max-md:text-[6vw] whitespace-nowrap" data-lines>100% Organic<br> Zero Guilt<br> True Taste</p>
        </div>
      </div>
    </div>
  </div>`;
}

export function initExperience(): void {
  const host = document.querySelector<HTMLElement>('[data-divider-host].bg-red');
  const root = host ?? document.querySelectorAll<HTMLElement>('.bg-red')[0];
  if (!root) return;

  root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    revealSplit(el, { scrollStart: 'top 88%' });
  });
  root.querySelectorAll<HTMLElement>('[data-lines]').forEach((el) => {
    revealLines(el, { start: 'top 95%' });
  });

  // eyes track the pointer
  const eyeL = root.querySelector<HTMLElement>('[data-eye="left"]');
  const eyeR = root.querySelector<HTMLElement>('[data-eye="right"]');
  if (eyeL && eyeR) {
    const setL = gsap.quickSetter(eyeL, 'rotation', 'deg');
    const setR = gsap.quickSetter(eyeR, 'rotation', 'deg');
    window.addEventListener(
      'mousemove',
      (e) => {
        const dx = e.clientX - window.innerWidth / 2;
        const dy = e.clientY - window.innerHeight / 2;
        const r = (Math.atan2(dy, dx) * 180) / Math.PI - 180;
        setL(r);
        setR(r);
      },
      { passive: true },
    );
  }

  // the section re-refreshes ScrollTrigger once its big image is decoded
  root.querySelectorAll('[data-refresh-on-load]').forEach((img) => {
    img.addEventListener('load', () => ScrollTrigger.refresh());
  });
  requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
}
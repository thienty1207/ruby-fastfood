// Ingredients — parallax veg. Port of chunk 0c-pxnn7_5v8q.js › module 21588.
//
// The section is wrapped in a `useLenis` subscriber that computes:
//   visible = scroll - offsetTop + innerHeight
//   if (visible > 0 && scroll < offsetTop + offsetHeight)
//     el.style.transform = `translateY(${visible * factor}px)`
// with factors -0.07 / -0.05 / -0.09 / -0.06 (CONFIRMED).
import { buildSplitMarkup, revealSplit } from '../components/splitText';

const VEG = [
  {
    src: '/img-webp/tomato.webp',
    alt: 'Fresh organic tomato slice',
    cls: 'w-[18vw] max-md:w-[26vw] h-auto absolute right-[15vw] max-md:right-[5vw] top-[18vw] max-md:top-[25vw] z-10',
    factor: -0.07,
  },
  {
    src: '/img-webp/cheese.webp',
    alt: 'Premium cheddar cheese slice',
    cls: 'w-[23vw] max-md:w-[32vw] h-auto absolute left-[14vw] max-md:left-[5vw] top-[37vw] max-md:top-[65vw] z-20',
    factor: -0.05,
  },
  {
    src: '/img-webp/meat.webp',
    alt: 'Smashed artisan beef patty',
    cls: 'w-[20vw] max-md:w-[28vw] h-auto absolute right-[16vw] max-md:right-[5vw] bottom-[-4vw] max-md:bottom-[-10vw] z-30',
    factor: -0.09,
  },
  {
    src: '/img-webp/lettuce.webp',
    alt: 'Crispy garden lettuce leaf',
    cls: 'w-[24vw] max-md:w-[36vw] h-auto absolute left-[15vw] max-md:left-[5vw] top-[5vw] max-md:top-[20vw] z-40',
    factor: -0.06,
  },
];

export const INGREDIENTS_HEADLINES = ['Every Layer', 'Packed With', 'Signature', 'Flavor'];

export function ingredientsMarkup(): string {
  return `
  <section id="ingredients" class="h-fit max-md:h-fit max-md:py-[14vw] w-full px-[2.5vw] relative">
    <div class="h-fit pt-[2vw] relative z-100 space-y-[3vw] w-full max-md:space-y-[6vw]">
      <p class="text-red -rotate-7 max-md:rotate-0 mx-auto uppercase text-stroke-180 text-center text-[2.8vw] max-md:text-[8vw] font-modak leading-[.9]!">Pure quality</p>
      <div class="max-md:mt-[10vw] flex flex-col gap-[1vw] w-full items-center justify-center">
        ${INGREDIENTS_HEADLINES.map(
          (h) =>
            `<p class="heading300 mx-auto text-center w-[60vw] max-md:w-full leading-[.75] uppercase text-stroke-180 text-red" data-split="words">${buildSplitMarkup(
              h,
              'words',
            )}</p>`,
        ).join('')}
      </div>
      ${VEG.map(
        (v) =>
          `<div data-veg data-factor="${v.factor}" class="${v.cls}" style="will-change:transform">
            <img src="${v.src}" alt="${v.alt}" width="1000" height="1000" class="h-full w-full object-contain">
          </div>`,
      ).join('')}
    </div>
  </section>`;
}

export function initIngredients(scrollOf: (cb: (s: number) => void) => void): void {
  const section = document.querySelector<HTMLElement>('#ingredients');
  if (!section) return;

  section.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    revealSplit(el, { scrollStart: 'top 90%' });
  });

  const targets = [...section.querySelectorAll<HTMLElement>('[data-veg]')].map((el) => ({
    el,
    factor: parseFloat(el.dataset.factor || '0') || 0,
  }));

  scrollOf((scroll) => {
    const top = section.offsetTop;
    const visible = scroll - top + window.innerHeight;
    if (visible > 0 && scroll < top + section.offsetHeight) {
      for (const t of targets) {
        t.el.style.transform = `translateY(${visible * t.factor}px)`;
      }
    }
  });
}

// CTA — "FEEL IT / feel the Change" with the peeling burger-boy sticker.
import { buildSplitMarkup, revealSplit } from '../motion/splitText';
import { revealLines } from '../motion/linesReveal';
import { orderButton } from '../motion/ui';
import { stickerMarkup } from '../motion/sticker';

export function ctaMarkup(): string {
  return `
  <section id="cta" class="h-fit w-full pt-[18vw] max-md:pt-[12vw] overflow-clip relative bg-beige" data-divider-host data-divider-fill="#ffd750" data-divider-flip="0">
    <div class="h-screen my-[8vw] mt-0 flex items-center justify-center w-full relative max-md:my-[2vw] max-md:mt-0 max-md:h-fit max-md:flex-col max-md:gap-0 max-md:px-[2vw]">
      ${stickerMarkup({
        imageSrc: '/img/burger-boy.png',
        width: '35vw',
        id: 'cta',
        className:
          'absolute z-222 bottom-[1vw] max-md:bottom-[65vw] max-md:left-[2vw] max-md:translate-x-0! -rotate-45 left-1/2 -translate-x-1/2 w-[35vw] h-auto max-md:w-[70vw] object-contain max-md:mb-[4vw]',
      })}

      <div class="w-[60vw] flex items-start gap-[2vw] justify-center flex-col self h-full max-md:w-full max-md:gap-[4vw] max-md:items-center max-md:h-fit">
        <p class="text-red -rotate-7 ml-[.5vw] uppercase text-stroke-180 font-modak leading-[.9]! text60 max-md:rotate-0 max-md:ml-0 max-md:translate-y-0 max-md:text-center">FEEL IT</p>

        <h2 class="text-red text-stroke-180 heading300 uppercase leading-[.75] max-md:leading-[.85]! max-md:text-[10vw] max-md:text-center" data-split="words">${buildSplitMarkup(
          'feel the\nChange',
          'words',
        )}</h2>

        <div data-lines data-delay=".25"><p class="text40 w-[30vw] font-mouse-memoirs leading-[1.1] max-md:w-full max-md:text-[4vw] max-md:text-center">Smashed for the bold, built for the hungry. Dive into a legendary craft experience where every crispy edge and juicy layer rules.</p></div>

        <div class="max-md:w-full max-md:flex max-md:justify-center">${orderButton()}</div>
      </div>

      <div class="w-[45vw] rounded-[2vw] overflow-hidden h-[60vw] max-md:w-full max-md:h-[40vh] max-md:min-h-[40vw] max-md:rounded-[4vw]">
        <img alt="Premium smashed burger on a wooden board" width="1000" height="1000" class="h-full w-full object-cover" src="/img-webp/cta.webp">
      </div>
    </div>
  </section>`;
}

export function initCta(): void {
  const cta = document.querySelector<HTMLElement>('#cta');
  if (!cta) return;

  cta.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    revealSplit(el, { scrollStart: 'top 90%' });
  });
  cta.querySelectorAll<HTMLElement>('[data-lines]').forEach((el) => {
    revealLines(el, { start: 'top 92%', delay: 0.25 });
  });
}
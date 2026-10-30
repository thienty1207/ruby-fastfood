// Rolling-label (hover text swap) + pill button markup — the original's
// shared UI atoms (chunks 0h72oc0nv1wic.js › 31922 and 0jg2m1sj81gv0.js › 62987).
import { escapeHtml } from './splitText';

export { escapeHtml };

export const PILL = {
  red: 'font-mouse-memoirs hover:scale-105 transition-all duration-300 flex items-center justify-center text-[1.3vw] max-md:text-[4vw] uppercase tracking-wide text-beige bg-red px-[1.6vw] py-[.5vw] max-md:px-[5vw] max-md:py-[1.8vw] group rounded-full hover:bg-black',
  primary:
    'font-mouse-memoirs uppercase tracking-wide text-[1.05vw] max-md:text-[4vw] bg-mustard text-black px-[1.6vw] py-[.75vw] max-md:px-[6vw] max-md:py-[2.6vw] rounded-full hover:bg-black hover:text-beige transition-all duration-300 ease-out group flex items-center justify-center',
  outline:
    'font-mouse-memoirs uppercase tracking-wide text-[1.05vw] max-md:text-[4vw] border border-black/20 text-black px-[1.6vw] py-[.75vw] max-md:px-[6vw] max-md:py-[2.6vw] rounded-full hover:bg-black hover:text-beige hover:border-black group transition-all duration-300 ease-out flex items-center justify-center',
} as const;

/** The two-layer text that rolls on hover (pure CSS, duration-300). */
export function rolling(label: string): string {
  const t = escapeHtml(label);
  return `<span class="overflow-hidden  relative inline-block group">
    <span class="block  group-hover:-translate-y-full translate-y-0 transition-all duration-300">${t}</span>
    <span class="block absolute inset-0 w-full h-full group-hover:translate-y-0 translate-y-full transition-all duration-300" aria-hidden="true">${t}</span>
  </span>`;
}

/**
 * The "Order Now" blob button. The path is the original's base blob `ea`;
 * hover morphs to one of the three `ei` shapes via MorphSVGPlugin.
 */
export const BLOB_BASE =
  'M310.777 0.20434C424.154 2.91791 540.733 50.9739 574.176 159.34C606.479 264.014 533.962 365.999 442.064 425.623C364.995 475.626 270.863 455.893 193.524 406.309C93.8313 342.395 -27.3608 259.503 5.48889 145.729C40.0621 25.9857 186.179 -2.77783 310.777 0.20434Z';

export const BLOB_VARIANTS = [
  'M302 27C437 -2 587 97 559 201C532 308 430 453 288 427C193 410 66 363 41 273C6 146 186 48 302 27Z',
  'M295 50C400 0 593 84 562 172C519 292 399 453 237 418C138 397 61 324 41 233C20 140 184 58 295 50Z',
  'M326 0C491 34 591 147 525 255C452 373 345 468 202 405C131 369 34 297 35 201C37 77 186 -10 326 0Z',
];

export function orderButton(label = 'Order Now', href = '/menu'): string {
  return `<a data-cursor-hide="true" class="relative w-fit mx-auto border-none bg-transparent p-0 block cursor-pointer outline-none select-none" href="${href}">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="-10 -10 602 475" preserveAspectRatio="none" class="absolute inset-0 w-full h-full z-0 pointer-events-none">
      <path class="blob-path" stroke="#ffffff" stroke-width="10" fill="#F91914" d="${BLOB_BASE}"></path>
    </svg>
    <span class="relative z-10 text-white font-bold text40 uppercase inline-block px-[4vw] py-[1.5vw] max-md:px-[10vw] max-md:py-[4vw]">${escapeHtml(label)}</span>
  </a>`;
}

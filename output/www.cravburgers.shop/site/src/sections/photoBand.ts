// Full-bleed photo band between two wave dividers — chunk 0c-pxnn7_5v8q.js.
// A 160vh box (70vh on mobile) holding an object-cover photo, with the red
// divider pinned to its top and the beige divider (flipped) to its bottom.
import { dividerMarkup } from '../components/divider';

export function photoBandMarkup(): string {
  return `
  <div class="h-[160vh] max-md:h-[70vh] w-full relative">
    ${dividerMarkup({ fill: '#f91814', flip: false })}
    ${dividerMarkup({ fill: '#f5e3cd', flip: true })}
    <img alt="CRAV Signature Cheesy Burger with dripping cheese" width="1000" height="1000" class="h-full w-full object-cover" src="/img-webp/cheesyBurger.webp">
  </div>`;
}

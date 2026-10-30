// Hero — chunk 0c-pxnn7_5v8q.js › module 24814.
// Burger float-in (CONFIRMED): from {scale:.5, opacity:0, y:100, rotate:-5}
//   to {scale:1, opacity:1, y:0, rotate:0, duration:1.5, ease:"back.out(1.5)", delay:.5}
//   then {y:"-=15", duration:2.5, ease:"sine.inOut", repeat:-1, yoyo:true, delay:1.7}
// Eyes track the cursor: rotation = atan2(dy,dx)*180/PI - 180 via quickSetter.
import { gsap } from '../motion/gsap';
import { buildSplitMarkup, revealSplit } from '../motion/splitText';
import { revealLines } from '../motion/linesReveal';

export function heroMarkup(): string {
  return `
  <section data-nav-dark="false" id="hero" class="h-screen w-full relative flex flex-col justify-between items-center pt-[8vw] max-md:pt-[40vw] max-md:h-[200vw] max-md:pb-[2vw]">
    <div class="w-fit h-fit relative">
      <h1 class="text-[30vw] leading-[.8] text-center text-red text-stroke-180 font-mouse-memoirs max-md:text-[26vw] max-md:leading-[.85]" data-split="words">${buildSplitMarkup(
        'THE BURGER',
        'words',
      )}</h1>
      <p class="absolute top-[10%] left-[10%] text-mustard-dark z-10 rotate-15 max-md:rotate-0 max-md:top-[2%] max-md:left-[2%] text-stroke-180 text-center text-[2.8vw] font-modak leading-[.9]! max-md:text-[6vw]" data-split="words" data-delay=".15">${buildSplitMarkup(
        'SMASHED\nFRESH',
        'words',
      )}</p>
      <p class="absolute bottom-[10%] right-[10%] text-mustard-dark z-10 -rotate-15 max-md:rotate-0 max-md:bottom-[2%] max-md:right-[2%] text-stroke-180 text-center text-[2.8vw] font-modak leading-[.9]! max-md:text-[6vw]" data-split="words" data-delay=".15">${buildSplitMarkup(
        'BOLD\nFLAVOR',
        'words',
      )}</p>
    </div>

    <div class="size-[40vw] z-20 absolute top-[60%] -translate-y-[60%] left-1/2 -translate-x-1/2 max-md:size-[80vw] max-md:top-[110vw] max-md:-translate-y-[50%]">
      <div data-hero-burger class="w-full h-full opacity-0">
        <img alt="CRAV Artisan Smashed Burger with fresh ingredients" width="1000" height="1000" class="h-full w-full object-contain" src="/img-webp/burgerH.webp">
      </div>
    </div>

    <p class="text-center text-[15vw] max-md:text-[20vw] font-modak uppercase mt-[15vw] relative z-20 max-md:z-20 text-stroke-180 text-mustard-dark translate-y-[-9vw] max-md:mt-[6vw] max-md:absolute max-md:top-[133vw] max-md:-translate-y-1/2" data-split="words" data-delay=".8">${buildSplitMarkup(
      'CRAV',
      'words',
    )}</p>

    <div class="w-full absolute bottom-0 left-0 flex justify-between px-[2.5vw] py-[2vw] max-md:static max-md:flex-col max-md:gap-[4vw] max-md:items-center max-md:px-[5vw] max-md:py-0">
      <div class="w-[23vw] max-md:w-full">
        <p class="text40 leading-none max-md:text-center" data-lines data-delay=".25">Smashed hot on the flat top, our prime patties lock in ultimate juiciness under a caramelized crust.</p>
      </div>
      <div class="w-[23vw] max-md:w-full">
        <p class="text40 leading-none text-right max-md:text-center" data-lines data-delay=".25">Topped with melted cheddar and our signature chili honey glaze crafted to satisfy your cravings since 1997.</p>
      </div>
    </div>
  </section>`;
}

export function initHero(): void {
  const hero = document.querySelector<HTMLElement>('#hero');
  if (!hero) return;

  // ---------- word pops ----------
  hero.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const delay = parseFloat(el.dataset.delay || '0') || 0;
    revealSplit(el, { delay, scrollStart: 'top 92%' });
  });

  // ---------- paragraph line masks ----------
  hero.querySelectorAll<HTMLElement>('[data-lines]').forEach((el) => {
    revealLines(el, { start: 'top 95%', delay: 0.25 });
  });

  // ---------- burger float + eyes ----------
  const burger = hero.querySelector<HTMLElement>('[data-hero-burger]');
  if (burger) {
    gsap.fromTo(
      burger,
      { scale: 0.5, opacity: 0, y: 100, rotate: -5 },
      { scale: 1, opacity: 1, y: 0, rotate: 0, duration: 1.5, ease: 'back.out(1.5)', delay: 0.5 },
    );
    gsap.to(burger, { y: '-=15', duration: 2.5, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1.7 });
  }

  // eyes: two white ellipses with black pupils, rotated toward the pointer
  const eyeL = hero.querySelector<HTMLElement>('[data-eye-l]');
  const eyeR = hero.querySelector<HTMLElement>('[data-eye-r]');
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
}
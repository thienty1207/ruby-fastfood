/**
 * Hero → Signature Menu cinematic transition.
 *
 * A single scrubbed timeline bridges the two sections so they read as one
 * continuous move rather than two unrelated blocks:
 *
 *   hero photo      scale 1 -> 1.12, y +8%   (slow drift, feels like the
 *                                             camera pushing in)
 *   hero scrim      opacity 1 -> 0.72        (the photo lifts toward the menu)
 *   hero content    y -60, opacity -> 0      (exits faster than the photo, so
 *                                             there is parallax between layers)
 *   menu intro      opacity 0 -> 1, y 40 -> 0 (arrives as the hero clears)
 *
 * Deliberately ONE timeline with ONE ScrollTrigger covering the whole handoff.
 * Separate triggers per element would drift out of sync the moment the user
 * stops mid-way or reverses.
 *
 * No pinning. The hero already fills the viewport; pinning it would add a
 * spacer, shift the document height and break the CSS sticky column below.
 */
import { gsap, ScrollTrigger } from '../motion/gsap';

export function initHeroMenuTransition(): () => void {
  const hero = document.querySelector<HTMLElement>('[data-rk-hero]');
  const menu = document.querySelector<HTMLElement>('[data-rk-sig]');
  if (!hero || !menu) return () => {};

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return () => {}; // everything stays legible and static

  const ctx = gsap.context(() => {
    const photo = hero.querySelector<HTMLElement>('[data-rk-photo-img]');
    const scrim = hero.querySelector<HTMLElement>('.rk-hero__scrim');
    const content = hero.querySelector<HTMLElement>('.rk-hero__inner');

    // The bridge spans from "hero is starting to leave" to "menu intro has
    // arrived". Using the hero as trigger with a `bottom`-based end keeps it
    // tied to real geometry (no hardcoded document pixels).
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'bottom 90%', // hero bottom crosses near the viewport bottom
        end: 'bottom 8%', // ... until it is almost past the top
        scrub: 0.8, // 0.8s catch-up: smooth but never laggy
        invalidateOnRefresh: true,
        // No pin, no snap: the user keeps full control of the scroll.
      },
    });

    if (photo) {
      tl.to(photo, { scale: 1.12, yPercent: 8, duration: 1 }, 0);
    }
    if (scrim) {
      tl.to(scrim, { opacity: 0.72, duration: 1 }, 0);
    }
    if (content) {
      tl.to(content, { y: -60, opacity: 0, duration: 0.72, ease: 'power1.in' }, 0);
    }

    // The menu intro is handled by initSignature()'s own entry timeline, which
    // is scrubbed against the same section. Here we only nudge the section's
    // own top edge so there is no dead frame: it slides up slightly as the hero
    // clears, creating overlap instead of a gap.
    tl.fromTo(
      menu,
      { y: 40 },
      { y: 0, duration: 1, ease: 'power1.out' },
      0,
    );

    // Keep the hero content readable at the very start: only begin the fade
    // once the section is genuinely on its way out.
    ScrollTrigger.create({
      trigger: hero,
      start: 'bottom 90%',
      end: 'bottom 8%',
      onUpdate: (self) => {
        hero.classList.toggle('is-leaving', self.progress > 0.02);
      },
    });
  });

  return () => ctx.revert();
}

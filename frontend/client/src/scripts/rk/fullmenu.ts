/**
 * Ruby Kitchen 81 — FULL MENU teaser (homepage section).
 *
 * Left: eyebrow / heading / body / CTA. Right: the printed menu cover.
 * The cover is presented as a physical object — a slight perspective, a paper
 * edge and a soft cast — rather than a flat thumbnail, which is what keeps the
 * section from reading as an image dump.
 *
 * Motion is one restrained reveal: the cover lifts and settles as the section
 * enters, the copy follows. On desktop with a fine pointer the cover tilts a few
 * degrees toward the cursor; that is the only interactive flourish.
 */
import { gsap, ScrollTrigger } from '../motion/gsap';
import { content } from '../../content/en';

const { fullMenu } = content;

export function fullMenuMarkup(): string {
  return `
  <section class="rk-fm" id="full-menu" data-rk-fm>
    <div class="rk-wrap rk-fm__inner">
      <div class="rk-fm__copy">
        <p class="rk-eyebrow rk-fm__eyebrow" data-rk-fm-eyebrow>${fullMenu.eyebrow}</p>
        <h2 class="rk-fm__title rk-display">
          <span class="rk-fm__line"><span data-rk-fm-line>${fullMenu.headingTop}</span></span>
          <span class="rk-fm__line rk-fm__line--alt"><span data-rk-fm-line>${fullMenu.headingBottom}</span></span>
        </h2>
        <p class="rk-fm__body" data-rk-fm-body>${fullMenu.body}</p>
        <a class="rk-btn rk-btn--flame rk-fm__cta" href="/menu" data-rk-fm-cta>
          ${fullMenu.cta}
        </a>
      </div>

      <a class="rk-fm__cover" href="/menu" aria-label="${fullMenu.cta}" data-rk-fm-cover>
        <span class="rk-fm__cover-glow" aria-hidden="true"></span>
        <span class="rk-fm__cover-sheet" data-rk-fm-sheet>
          <img
            src="${fullMenu.cover.src}"
            alt="${fullMenu.cover.alt}"
            width="1055"
            height="1491"
            class="rk-fm__cover-img"
            loading="lazy"
            decoding="async"
            draggable="false"
          />
        </span>
        <span class="rk-fm__cover-tag">${fullMenu.pages.length} pages</span>
      </a>
    </div>
  </section>`;
}

export function initFullMenu(): () => void {
  const root = document.querySelector<HTMLElement>('[data-rk-fm]');
  if (!root) return () => {};

  const sheet = root.querySelector<HTMLElement>('[data-rk-fm-sheet]');
  const cover = root.querySelector<HTMLElement>('[data-rk-fm-cover]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ctx = gsap.context(() => {
    if (reduced) {
      gsap.set('[data-rk-fm-eyebrow], [data-rk-fm-line], [data-rk-fm-body], [data-rk-fm-cta], [data-rk-fm-sheet]', {
        opacity: 1,
        y: 0,
        clearProps: 'transform',
      });
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: root, start: 'top 74%', once: true },
    });

    tl.from('[data-rk-fm-eyebrow]', { opacity: 0, y: 12, duration: 0.45 })
      .from(
        '[data-rk-fm-line]',
        { yPercent: 110, opacity: 0, duration: 0.85, stagger: 0.07, ease: 'power4.out' },
        0.05,
      )
      .from('[data-rk-fm-body]', { opacity: 0, y: 14, duration: 0.5 }, 0.4)
      .from('[data-rk-fm-cta]', { opacity: 0, y: 12, duration: 0.45 }, 0.5)
      // The cover arrives after the copy, rising and settling from 96% scale.
      .from(
        sheet,
        { opacity: 0, yPercent: 6, scale: 0.96, rotate: -1.2, duration: 1.05, ease: 'power3.out' },
        0.28,
      );

    // Cursor tilt — desktop pointers only, and only while the section is on
    // screen, so it never runs against an off-screen element.
    if (cover && sheet && window.matchMedia('(hover: hover) and (min-width: 1024px)').matches) {
      const rx = gsap.quickTo(sheet, 'rotationX', { duration: 0.6, ease: 'power2.out' });
      const ry = gsap.quickTo(sheet, 'rotationY', { duration: 0.6, ease: 'power2.out' });

      let active = false;
      const zone = ScrollTrigger.create({
        trigger: root,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          active = self.isActive;
        },
      });

      const onMove = (e: PointerEvent) => {
        if (!active) return;
        const r = cover.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * 9);
        rx(-py * 7);
      };
      const onLeave = () => {
        rx(0);
        ry(0);
      };

      cover.addEventListener('pointermove', onMove, { passive: true });
      cover.addEventListener('pointerleave', onLeave);

      return () => {
        cover.removeEventListener('pointermove', onMove);
        cover.removeEventListener('pointerleave', onLeave);
        zone.kill();
      };
    }
  }, root);

  return () => ctx.revert();
}

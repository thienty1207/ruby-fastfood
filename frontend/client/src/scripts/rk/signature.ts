/**
 * SIGNATURE MENU — pinned stack transition.
 *
 * STRUCTURE (desktop):
 *   .rk-sig                      section, pinned by ScrollTrigger
 *     .rk-sig__inner             two columns
 *       .rk-sig__left            static intro: eyebrow, headline, support, 01/04
 *       .rk-sig__right
 *         .rk-sig__stage         ONE fixed-size stage
 *           .rk-sig__layer x4    absolutely stacked, newest on top
 *
 * Behaviour: layer 1 is visible; layers 2-4 start translated one full stage
 * height below (yPercent 100) and slide up to 0 as the user scrolls, each
 * covering the previous one. One ScrollTrigger, one timeline, pinned.
 *
 * Why not CSS sticky: the requirement is that the LEFT column and the STAGE
 * both stay put while the page keeps scrolling for ~3 viewport heights. sticky
 * can only pin against a scrolling ancestor and cannot release on a scroll
 * budget; pin + scrub gives exact control over how much scroll each transition
 * consumes. Nothing here mixes sticky with pin on the same element.
 */
import { gsap, ScrollTrigger } from '../motion/gsap';
import { content } from '../../content/en';

const { signature } = content;

export function signatureMarkup(): string {
  const total = String(signature.cards.length).padStart(2, '0');

  const layers = signature.cards
    .map((c, i) => {
      const media = c.imageUrl
        ? `<div class="rk-sig__media" data-rk-sig-media>
             <div class="rk-sig__media-inner" data-rk-sig-media-inner>
               <img
                 src="${c.imageUrl}"
                 alt="${c.imageAlt}"
                 width="1448"
                 height="1086"
                 class="rk-sig__img"
                 data-rk-sig-img
                 loading="${i === 0 ? 'eager' : 'lazy'}"
                 decoding="async"
                 draggable="false"
               />
             </div>
           </div>`
        : `<div class="rk-sig__media rk-sig__media--type" aria-hidden="true">
             <span class="rk-sig__watermark">${c.n}</span>
           </div>`;

      return `
        <article class="rk-sig__layer${i === 0 ? ' is-active' : ''}" data-rk-sig-layer="${i}" data-rk-sig-card>
          ${media}
        </article>`;
    })
    .join('');

  const ticks = signature.cards
    .map((c, i) => `<li class="rk-sig__tick${i === 0 ? ' is-active' : ''}" data-rk-sig-tick="${i}"></li>`)
    .join('');

  return `
  <section class="rk-sig" id="${signature.id}" data-rk-sig>
    <div class="rk-sig__inner">
      <!-- LEFT: static intro column (never moves) -->
      <div class="rk-sig__left">
        <p class="rk-eyebrow rk-sig__eyebrow" data-rk-sig-eyebrow>${signature.eyebrow}</p>

        <h2 class="rk-sig__title rk-display">
          <span class="rk-sig__line"><span data-rk-sig-line>${signature.headlineTop}</span></span>
          <span class="rk-sig__line rk-sig__line--alt"><span data-rk-sig-line>${signature.headlineBottom}</span></span>
        </h2>

        <p class="rk-sig__support" data-rk-sig-support>${signature.support}</p>

        <div class="rk-sig__progress" data-rk-sig-progress aria-hidden="true">
          <span class="rk-sig__counter">
            <span data-rk-sig-current>01</span><span class="rk-sig__slash">/</span><span>${total}</span>
          </span>
          <span class="rk-sig__track">${ticks}</span>
          <span class="rk-sig__hint">${signature.scrollHint}</span>
        </div>
      </div>

      <!-- RIGHT: one fixed stage, four stacked layers -->
      <div class="rk-sig__right">
        <div class="rk-sig__stage" data-rk-sig-stage>
          ${layers}
        </div>

        <div class="rk-sig__info" data-rk-sig-info>
          ${signature.cards
            .map(
              (c, i) => `
            <div class="rk-sig__info-row${i === 0 ? ' is-active' : ''}" data-rk-sig-info-row="${i}">
              <h3 class="rk-sig__name rk-display">${c.name}</h3>
              <div class="rk-sig__meta">
                <span class="rk-sig__n">${c.n}</span>
                <p class="rk-sig__copy">${c.copy}</p>
                <span class="rk-sig__price ${c.price === null ? 'rk-sig__price--cat' : ''}">${c.priceLabel}</span>
              </div>
            </div>`,
            )
            .join('')}
        </div>
      </div>    </div>
  </section>`;
}

/**
 * Motion. One branch for the pinned desktop experience, one for tablet/mobile
 * flow, one for reduced motion. gsap.matchMedia() tears down whichever branch
 * stops matching, so resizing across the breakpoint cannot leave a stale pin.
 */
export function initSignature(): () => void {
  const root = document.querySelector<HTMLElement>('[data-rk-sig]');
  if (!root) return () => {};

  const layers = [...root.querySelectorAll<HTMLElement>('[data-rk-sig-layer]')];
  const ticks = [...root.querySelectorAll<HTMLElement>('[data-rk-sig-tick]')];
  const counter = root.querySelector<HTMLElement>('[data-rk-sig-current]');
  const infoRows = [...root.querySelectorAll<HTMLElement>('[data-rk-sig-info-row]')];
  const stage = root.querySelector<HTMLElement>('[data-rk-sig-stage]');
  if (!stage || !layers.length) return () => {};

  const mm = gsap.matchMedia();

  /* Indicator: one call per transition, driven by timeline progress rather than
     by per-layer triggers, so it can never disagree with the visible layer. */
  const setActive = (idx: number) => {
    if (counter) counter.textContent = String(idx + 1).padStart(2, '0');
    ticks.forEach((t, i) => t.classList.toggle('is-active', i === idx));
    layers.forEach((l, i) => l.classList.toggle('is-active', i === idx));
    infoRows.forEach((r, i) => r.classList.toggle('is-active', i === idx));
  };

  /* ══════════════════════════════════════════════════════════════════════
     DESKTOP — pinned stack transition
     ══════════════════════════════════════════════════════════════════════ */
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    setActive(0);

    // Layer 0 is in place; the rest start exactly one stage below.
    layers.forEach((layer, i) => {
      gsap.set(layer, {
        yPercent: i === 0 ? 0 : 100,
        zIndex: i + 1,
        transformOrigin: '50% 100%',
      });
    });

    const leftBits = '[data-rk-sig-eyebrow], [data-rk-sig-line], [data-rk-sig-support], [data-rk-sig-progress]';
    gsap.set(leftBits, { opacity: 0, y: 18 });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: () => `+=${window.innerHeight * (layers.length + 0.6)}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.7,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Only report the layer that is at least half-way in.
          const p = self.progress;
          const seg = 1 / (layers.length - 1);
          const idx = Math.min(layers.length - 1, Math.round((p - 0.12) / seg));
          setActive(Math.max(0, idx));
        },
      },
    });

    // 0.00 - 0.12  intro fades up (left column only; it never moves)
    tl.to('[data-rk-sig-eyebrow]', { opacity: 1, y: 0, duration: 0.05 }, 0);
    tl.to('[data-rk-sig-line]', { opacity: 1, y: 0, duration: 0.06, stagger: 0.015 }, 0.02);
    tl.to('[data-rk-sig-support]', { opacity: 1, y: 0, duration: 0.05 }, 0.05);
    tl.to('[data-rk-sig-progress]', { opacity: 1, y: 0, duration: 0.04 }, 0.07);

    // 0.12 - 1.00  the stack: each incoming layer slides up over the last.
    // The 12% head start means the user sees the intro finish before the first
    // photo starts moving, instead of both competing at once.
    const startAt = 0.12;
    const segLen = (1 - startAt) / (layers.length - 1);

    for (let i = 1; i < layers.length; i++) {
      const at = startAt + segLen * (i - 1);
      tl.fromTo(
        layers[i],
        { yPercent: 100 },
        { yPercent: 0, duration: segLen },
        at,
      );
    }

    return () => {
      gsap.set(layers, { clearProps: 'transform,opacity,zIndex' });
      gsap.set(leftBits, { clearProps: 'opacity,transform' });
    };
  });

  /* ══════════════════════════════════════════════════════════════════════
     FLOW — tablet and mobile, and reduced motion
     Layers become normal stacked blocks; a short fade-up each, no pin.
     ══════════════════════════════════════════════════════════════════════ */
  mm.add('(max-width: 1023px), (prefers-reduced-motion: reduce)', () => {
    setActive(0);

    gsap.set(layers, { clearProps: 'transform,opacity,zIndex' });
    gsap.set('[data-rk-sig-eyebrow], [data-rk-sig-line], [data-rk-sig-support], [data-rk-sig-progress]', {
      clearProps: 'opacity,transform',
    });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    layers.forEach((layer) => {
      gsap.from(layer, {
        opacity: 0,
        y: 32,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: layer, start: 'top 90%', once: true },
      });
    });

    return () => {
      gsap.set(layers, { clearProps: 'transform,opacity,zIndex' });
    };
  });

  return () => mm.revert();
}

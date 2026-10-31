/**
 * Ruby Kitchen 81 — Signature Menu Showcase (#menu)
 *
 * Sticky split-screen scrollytelling: a 40% left column that stays put while a
 * 60% right column of four cards scrolls past it. Pinning is done with CSS
 * `position: sticky` — NOT ScrollTrigger.pin — so there is no spacer injection,
 * no layout shift, and the column releases naturally at the section boundary.
 *
 * ScrollTrigger is used only to observe:
 *   - which card is currently in view  -> updates the 01/04 indicator
 *   - individual card reveals          -> subtle y / opacity / scale
 *
 * Cards are image-ready: `imageUrl` is optional, and a card with no image falls
 * back to a composed type + checkerboard treatment instead of an empty box.
 */
import { gsap, ScrollTrigger } from '../motion/gsap';
import { content } from '../../content/en';

const { signature } = content;

export function signatureMarkup(): string {
  const total = String(signature.cards.length).padStart(2, '0');

  const cards = signature.cards
    .map((c, i) => {
      const media = c.imageUrl
        ? `<div class="rk-sig__media" data-rk-sig-media>
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
             <span class="rk-sig__media-scrim" aria-hidden="true"></span>
           </div>`
        : `<div class="rk-sig__media rk-sig__media--type" aria-hidden="true">
             <span class="rk-sig__watermark">${c.n}</span>
           </div>`;

      return `
      <article class="rk-sig-card" data-rk-sig-card data-index="${i}">
        ${media}
        <div class="rk-sig-card__body">
          <span class="rk-sig-card__n">${c.n}</span>
          <h3 class="rk-sig-card__name rk-display">${c.name}</h3>
          <p class="rk-sig-card__copy">${c.copy}</p>
          <span class="rk-sig-card__price ${c.price === null ? 'rk-sig-card__price--cat' : ''}">
            ${c.priceLabel}
          </span>
        </div>
      </article>`;
    })
    .join('');

  const ticks = signature.cards
    .map((c, i) => `<li class="rk-sig__tick${i === 0 ? ' is-active' : ''}" data-rk-sig-tick="${i}"></li>`)
    .join('');

  return `
  <section class="rk-sig" id="${signature.id}" data-rk-sig>
    <div class="rk-sig__inner">
      <!-- LEFT: sticky intro column -->
      <div class="rk-sig__left">
        <div class="rk-sig__sticky">
          <p class="rk-eyebrow rk-sig__eyebrow" data-rk-sig-eyebrow>${signature.eyebrow}</p>

          <h2 class="rk-sig__title rk-display">
            <span class="rk-sig__line"><span data-rk-sig-line>${signature.headlineTop}</span></span>
            <span class="rk-sig__line rk-sig__line--alt"><span data-rk-sig-line>${signature.headlineBottom}</span></span>
          </h2>

          <p class="rk-sig__support" data-rk-sig-support>${signature.support}</p>

          <div class="rk-sig__progress" aria-hidden="true">
            <span class="rk-sig__counter">
              <span data-rk-sig-current>01</span><span class="rk-sig__slash">/</span><span>${total}</span>
            </span>
            <span class="rk-sig__track">${ticks}</span>
            <span class="rk-sig__hint">${signature.scrollHint}</span>
          </div>
        </div>
      </div>

      <!-- RIGHT: scrolling card column -->
      <div class="rk-sig__right">
        ${cards}
      </div>
    </div>
  </section>`;
}

/** Returns a disposer that reverts every tween/trigger created here. */
export function initSignature(): () => void {
  const root = document.querySelector<HTMLElement>('[data-rk-sig]');
  if (!root) return () => {};

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cards = [...root.querySelectorAll<HTMLElement>('[data-rk-sig-card]')];
  const ticks = [...root.querySelectorAll<HTMLElement>('[data-rk-sig-tick]')];
  const counter = root.querySelector<HTMLElement>('[data-rk-sig-current]');

  const ctx = gsap.context(() => {
    /* ── Image fallback: a card whose photo fails keeps the type-only look
          instead of showing a broken-image icon. ─────────────────────────── */
    root.querySelectorAll<HTMLElement>('[data-rk-sig-media]').forEach((media) => {
      const img = media.querySelector<HTMLImageElement>('[data-rk-sig-img]');
      if (!img) return;
      const fail = () => media.classList.add('is-missing');
      if (img.complete && img.naturalWidth === 0) fail();
      else img.addEventListener('error', fail, { once: true });
    });

    /* ── Left column: reveal once on entry ───────────────────────────── */
    if (reduced) {
      gsap.set('[data-rk-sig-eyebrow], [data-rk-sig-line], [data-rk-sig-support], [data-rk-sig-progress]', {
        opacity: 1,
        y: 0,
      });
      gsap.set(cards, { opacity: 1, y: 0, scale: 1 });
    } else {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: 'top 72%', once: true },
        defaults: { ease: 'power3.out' },
      });
      tl.from('[data-rk-sig-eyebrow]', { opacity: 0, y: 12, duration: 0.45 })
        .from(
          '[data-rk-sig-line]',
          { yPercent: 110, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power4.out' },
          0.06,
        )
        .from('[data-rk-sig-support]', { opacity: 0, y: 14, duration: 0.5 }, 0.38)
        .from('[data-rk-sig-progress]', { opacity: 0, y: 10, duration: 0.45 }, 0.5);

      /* ── Cards: each reveals as it enters, no pinning ────────────────── */
      cards.forEach((card) => {
        gsap.from(card, {
          opacity: 0,
          y: 56,
          scale: 0.965,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%', once: true },
        });
      });
    }

    /* ── Active-card indicator ───────────────────────────────────────── */
    const setActive = (idx: number) => {
      if (counter) counter.textContent = String(idx + 1).padStart(2, '0');
      ticks.forEach((t, i) => t.classList.toggle('is-active', i === idx));
      cards.forEach((c, i) => c.classList.toggle('is-current', i === idx));
    };

    // One ScrollTrigger per card: fires on enter and on enter-back, so the
    // indicator is correct scrolling in BOTH directions.
    cards.forEach((card, i) => {
      ScrollTrigger.create({
        trigger: card,
        start: 'top 62%',
        end: 'bottom 62%',
        onEnter: () => setActive(i),
        onEnterBack: () => setActive(i),
      });
    });

    setActive(0);

    /* ── Hover: restrained premium lift (desktop pointers only) ──────── */
    if (!reduced && window.matchMedia('(hover: hover)').matches) {
      cards.forEach((card) => {
        const img = card.querySelector<HTMLElement>('[data-rk-sig-img]');
        const enter = gsap.to(img ?? card, {
          scale: img ? 1.04 : 1,
          duration: 0.6,
          ease: 'power2.out',
          paused: true,
        });
        card.addEventListener('pointerenter', () => enter.play());
        card.addEventListener('pointerleave', () => enter.reverse());
      });
    }
  }, root);

  return () => ctx.revert();
}

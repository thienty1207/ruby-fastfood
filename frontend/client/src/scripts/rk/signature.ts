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
             <span class="rk-sig__media-scrim" aria-hidden="true"></span>
           </div>`
        : `<div class="rk-sig__media rk-sig__media--type" aria-hidden="true">
             <span class="rk-sig__watermark">${c.n}</span>
           </div>`;

      return `
      <article class="rk-sig-card" data-rk-sig-card data-index="${i}">
        <div class="rk-sig-card__shell" data-rk-sig-shell>
          ${media}
          <div class="rk-sig-card__body" data-rk-sig-body>
            <span class="rk-sig-card__n" data-rk-sig-el="n">${c.n}</span>
            <h3 class="rk-sig-card__name rk-display" data-rk-sig-el="name">${c.name}</h3>
            <p class="rk-sig-card__copy" data-rk-sig-el="copy">${c.copy}</p>
            <span class="rk-sig-card__price ${c.price === null ? 'rk-sig-card__price--cat' : ''}" data-rk-sig-el="price">
              ${c.priceLabel}
            </span>
          </div>
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

          <div class="rk-sig__progress" data-rk-sig-progress aria-hidden="true">
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

/**
 * Rewritten motion block for the signature section.
 *
 * Confirmed problems in the previous version:
 *   B. GSAP targeted [data-rk-sig-progress] but the markup only had the CLASS
 *      .rk-sig__progress, so the progress reveal silently never ran.
 *   C. .rk-sig-card carried `transition: transform` in CSS while GSAP also
 *      wrote `transform` on the same node — the two fought, and every scrub
 *      tick was fought by a 0.45s CSS interpolation.
 *   D. Card reveals used `once: true`, so scrolling backwards left cards
 *      stuck in their end state and the motion was not reversible at all.
 *
 * The rewrite separates the three concerns onto three different elements:
 *   .rk-sig-card          geometry only — CSS owns its border/background
 *   .rk-sig-card__shell   y-translate + opacity (scrubbed)
 *   .rk-sig__media-inner  image scale + parallax (scrubbed)
 *   .rk-sig-card__body    text stagger (scrubbed)
 * Nothing writes `transform` on an element that CSS also transitions.
 */
export function initSignature(): () => void {
  const root = document.querySelector<HTMLElement>('[data-rk-sig]');
  if (!root) return () => {};

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 1023px)').matches;
  const cards = [...root.querySelectorAll<HTMLElement>('[data-rk-sig-card]')];
  const ticks = [...root.querySelectorAll<HTMLElement>('[data-rk-sig-tick]')];
  const counter = root.querySelector<HTMLElement>('[data-rk-sig-current]');

  const ctx = gsap.context(() => {
    /* ── Image fallback ─────────────────────────────────────────────── */
    root.querySelectorAll<HTMLElement>('[data-rk-sig-media]').forEach((media) => {
      const img = media.querySelector<HTMLImageElement>('[data-rk-sig-img]');
      if (!img) return;
      const fail = () => media.classList.add('is-missing');
      if (img.complete && img.naturalWidth === 0) fail();
      else img.addEventListener('error', fail, { once: true });
    });

    /* ── Reduced motion: everything immediately readable, no scrub ──── */
    if (reduced) {
      gsap.set(
        '[data-rk-sig-eyebrow], [data-rk-sig-line], [data-rk-sig-support], [data-rk-sig-progress]',
        { opacity: 1, y: 0, clearProps: 'transform' },
      );
      gsap.set('[data-rk-sig-shell], [data-rk-sig-body] > *', { opacity: 1, y: 0, clearProps: 'transform' });
      gsap.set('[data-rk-sig-media-inner]', { scale: 1, y: 0 });
      // No clip mask under reduced motion: the image must be fully visible
      // immediately, not revealed by scroll.
      gsap.set('[data-rk-sig-media]', { clipPath: 'none' });
    } else {
      /* ── LEFT COLUMN: scrubbed intro ──────────────────────────────── */
      // Scrubbed rather than once-only so reversing the scroll rebuilds the
      // intro instead of leaving it in a half-state.
      const introTl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top 88%',
          end: 'top 38%',
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      });

      introTl
        .fromTo(
          '[data-rk-sig-eyebrow]',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, ease: 'none', duration: 0.25 },
          0,
        )
        .fromTo(
          '[data-rk-sig-line]',
          { yPercent: 108, opacity: 0 },
          { yPercent: 0, opacity: 1, stagger: 0.06, ease: 'none', duration: 0.5 },
          0.04,
        )
        .fromTo(
          '[data-rk-sig-support]',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, ease: 'none', duration: 0.28 },
          0.42,
        )
        .fromTo(
          '[data-rk-sig-progress]',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, ease: 'none', duration: 0.22 },
          0.62,
        );

      /* ── CARDS: one scrubbed timeline per card ────────────────────── */
      // start/end are RELATIVE to the card, never absolute document pixels.
      // Mobile gets a shorter travel so the section does not feel sluggish on
      // touch where scroll events arrive less densely.
      const travel = isMobile ? 40 : 64;
      const parallax = isMobile ? 6 : 14;

      cards.forEach((card) => {
        const shell = card.querySelector<HTMLElement>('[data-rk-sig-shell]');
        const media = card.querySelector<HTMLElement>('[data-rk-sig-media]');
        const mediaInner = card.querySelector<HTMLElement>('[data-rk-sig-media-inner]');
        const bodyEls = [...card.querySelectorAll<HTMLElement>('[data-rk-sig-el]')];

        // Initial state is applied with gsap.set(), NOT with fromTo inside the
        // timeline. A fromTo that starts at a later timeline position does not
        // render its "from" values before its start time, so the text was
        // visible at progress 0, vanished at 0.35, then came back — measured
        // name opacity 1.00 -> 0.71 -> 1.00. Setting the state up front and
        // animating with .to() removes the flicker entirely.
        if (shell) gsap.set(shell, { y: travel, opacity: 0.25 });
        if (mediaInner) gsap.set(mediaInner, { scale: 1.08, yPercent: parallax });
        // Clip reveal: the photo's top edge starts 14% down and slides open as
        // the card settles, so the image "enters" the frame instead of just
        // scaling. Applied to the media BOX (not the parallax layer) so the
        // mask stays put while the image drifts inside it.
        if (media) gsap.set(media, { clipPath: 'inset(14% 0% 0% 0%)' });
        if (bodyEls.length) gsap.set(bodyEls, { y: 22, opacity: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top 92%', // begins while the card is still below the fold
            end: 'top 42%', // settles when the card reaches the upper area
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });

        // 1. Card entrance — geometry on the shell, so the card keeps its CSS
        //    border/background transitions intact.
        if (shell) {
          tl.to(shell, { y: 0, opacity: 1, ease: 'power1.out', duration: 0.55 }, 0);
        }

        // 2. Image: clip opens, then settles from 1.08 to 1 while drifting
        //    upward inside the media box (parallax, no exposed edges).
        if (media) {
          tl.to(media, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power1.out', duration: 0.62 }, 0);
        }
        if (mediaInner) {
          tl.to(mediaInner, { scale: 1, yPercent: 0, ease: 'none', duration: 0.85 }, 0);
        }

        // 3. Text: number -> title -> copy -> price, sequential.
        if (bodyEls.length) {
          tl.to(bodyEls, { y: 0, opacity: 1, ease: 'power1.out', stagger: 0.06, duration: 0.4 }, 0.18);
        }
      });
    }

    /* ── will-change is scoped to "section is on screen" ────────────────
       Four shells + four media layers permanently promoted is wasteful GPU
       memory for a section that is off-screen most of the time. The class is
       toggled by ScrollTrigger so the promotion exists only while scrubbing. */
    if (!reduced) {
      ScrollTrigger.create({
        trigger: root,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => root.classList.toggle('is-animating', self.isActive),
      });
    }

    /* ── Active-card indicator ──────────────────────────────────────── */
    const setActive = (idx: number) => {
      if (counter) counter.textContent = String(idx + 1).padStart(2, '0');
      ticks.forEach((t, i) => t.classList.toggle('is-active', i === idx));
      cards.forEach((c, i) => c.classList.toggle('is-current', i === idx));
    };

    // onEnter AND onEnterBack keep the counter correct in both directions.
    // The 50% line is the "is this the card I am looking at" test.
    cards.forEach((card, i) => {
      ScrollTrigger.create({
        trigger: card,
        start: 'top 55%',
        end: 'bottom 55%',
        onEnter: () => setActive(i),
        onEnterBack: () => setActive(i),
      });
    });

    setActive(0);

    /* ── Hover: image only, and never while its scrub is running ────── */
    if (!reduced && window.matchMedia('(hover: hover)').matches) {
      cards.forEach((card) => {
        const mediaInner = card.querySelector<HTMLElement>('[data-rk-sig-media-inner]');
        if (!mediaInner) return;

        // quickTo keeps this separate from the scrubbed timeline: it writes to
        // the same element but through its own tween that the scrub does not
        // overwrite (the scrub targets scale, this targets a CSS custom prop
        // driven scale is overkill — instead we nudge brightness of the scrim).
        const scrim = card.querySelector<HTMLElement>('.rk-sig__media-scrim');
        if (!scrim) return;
        const dim = gsap.quickTo(scrim, 'opacity', { duration: 0.45, ease: 'power2.out' });

        card.addEventListener('pointerenter', () => dim(0.72));
        card.addEventListener('pointerleave', () => dim(1));
      });
    }
  }, root);

  return () => ctx.revert();
}

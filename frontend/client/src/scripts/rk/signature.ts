/**
 * Ruby Kitchen 81 — SIGNATURE SHOWCASE (#menu)
 *
 * Editorial chapter sequence, modelled on premium automotive service sections:
 * a pinned scene where the LEFT panel is a per-item story panel and the RIGHT is
 * ONE fixed image stage. Each next photograph slides up over the previous one.
 *
 * DESKTOP STRUCTURE
 *   .rk-sig                       pinned by ScrollTrigger
 *     .rk-sig__inner              40 / 60 grid, one viewport tall
 *       .rk-sig__left
 *         .rk-sig__chapters        x4 stacked in one grid cell, only .is-active shows
 *         .rk-sig__progress        01/04 counter + ticks
 *       .rk-sig__right
 *         .rk-sig__stage           fixed frame, overflow hidden
 *           .rk-sig__panel x4      absolute, inset 0, newest on top
 *
 * Chapters and panels share the same index, so the text and the photograph can
 * never disagree: both the indicator and the visible chapter are derived from
 * the same timeline progress value.
 *
 * MOBILE — no pin. Chapters and photographs become ordinary blocks in order.
 */
import { gsap, ScrollTrigger } from '../motion/gsap';
import { content } from '../../content/en';

const { signature } = content;

export function signatureMarkup(): string {
  const total = String(signature.items.length).padStart(2, '0');

  const panels = signature.items
    .map((it, i) => {
      const media = it.imageUrl
        ? `<div class="rk-sig__media">
             <img
               src="${it.imageUrl}"
               alt="${it.imageAlt ?? it.name}"
               width="1448"
               height="1086"
               class="rk-sig__img"
               data-rk-sig-img
               loading="${i === 0 ? 'eager' : 'lazy'}"
               decoding="async"
               draggable="false"
               ${it.focus ? `style="object-position:${it.focus}"` : ''}
             />
             <span class="rk-sig__media-veil" aria-hidden="true"></span>
           </div>`
        : `<div class="rk-sig__media rk-sig__media--type" aria-hidden="true">
             <span class="rk-sig__watermark">${it.n}</span>
           </div>`;

      return `
        <article class="rk-sig__panel${i === 0 ? ' is-active' : ''}" data-rk-sig-panel="${i}">
          ${media}
          <div class="rk-sig__caption">
            <span class="rk-sig__caption-n">${it.n}</span>
            <span class="rk-sig__caption-name rk-display">${it.name}</span>
            <span class="rk-sig__caption-price">${it.priceLabel}</span>
          </div>
        </article>`;
    })
    .join('');

  // One chapter per item: eyebrow, big heading, body, meta. Stacked so the swap
  // cannot change the panel height (which would shift the pinned layout).
  const chapters = signature.items
    .map(
      (it, i) => `
        <div class="rk-sig__chapter${i === 0 ? ' is-active' : ''}" data-rk-sig-chapter="${i}">
          <p class="rk-eyebrow rk-sig__eyebrow">${it.eyebrow}</p>
          <h2 class="rk-sig__heading rk-display">${it.heading}</h2>
          <p class="rk-sig__body">${it.body}</p>
          <p class="rk-sig__meta">${it.meta}</p>
        </div>`,
    )
    .join('');

  const ticks = signature.items
    .map((_, i) => `<li class="rk-sig__tick${i === 0 ? ' is-active' : ''}" data-rk-sig-tick="${i}"></li>`)
    .join('');

  return `
  <section class="rk-sig" id="${signature.id}" data-rk-sig>
    <div class="rk-sig__inner">
      <!-- LEFT: per-item story panel -->
      <div class="rk-sig__left">
        <div class="rk-sig__chapters" data-rk-sig-chapters>
          ${chapters}
        </div>

        <div class="rk-sig__progress" data-rk-sig-progress>
          <span class="rk-sig__counter">
            <span data-rk-sig-current>01</span><span class="rk-sig__slash">/</span><span>${total}</span>
          </span>
          <span class="rk-sig__track">${ticks}</span>
          <span class="rk-sig__hint">${signature.scrollHint}</span>
        </div>
      </div>

      <!-- RIGHT: one fixed stage, layered panels -->
      <div class="rk-sig__right">
        <div class="rk-sig__stage" data-rk-sig-stage>
          ${panels}
        </div>
      </div>
    </div>
  </section>`;
}

export function initSignature(): () => void {
  const root = document.querySelector<HTMLElement>('[data-rk-sig]');
  if (!root) return () => {};

  const panels = [...root.querySelectorAll<HTMLElement>('[data-rk-sig-panel]')];
  const chapters = [...root.querySelectorAll<HTMLElement>('[data-rk-sig-chapter]')];
  const ticks = [...root.querySelectorAll<HTMLElement>('[data-rk-sig-tick]')];
  const counter = root.querySelector<HTMLElement>('[data-rk-sig-current]');
  const stage = root.querySelector<HTMLElement>('[data-rk-sig-stage]');
  if (!stage || !panels.length) return () => {};

  const count = panels.length;
  const mm = gsap.matchMedia();

  /* Single source of truth for "which item is showing". Called from the master
     timeline only, so text, image and counter are always on the same index. */
  const setActive = (idx: number) => {
    const i = Math.max(0, Math.min(count - 1, idx));
    if (counter) counter.textContent = String(i + 1).padStart(2, '0');
    ticks.forEach((t, k) => t.classList.toggle('is-active', k === i));
    panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
    chapters.forEach((c, k) => c.classList.toggle('is-active', k === i));
  };

  /* ══════════════════════════════════════════════════════════════════════
     DESKTOP — pinned chapter sequence
     ══════════════════════════════════════════════════════════════════════ */
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    setActive(0);

    // Panel 0 is in place; the rest wait exactly one stage below.
    panels.forEach((p, i) => {
      gsap.set(p, { yPercent: i === 0 ? 0 : 100, zIndex: i + 1 });
    });

    // Chapters are handled entirely by CSS (.is-active + opacity transition).
    // Deliberately no GSAP autoAlpha here — see the note in the timing block.

    // Fraction of each item's slice spent settled before the next slides in.
    // Fraction of each unit spent settled. Lower = longer slide, shorter settle.
    // 0.58 gives a 0.42-unit slide: ~41% more scroll per transition than 0.62.
    const HOLD = 0.58;

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        // One viewport of dwell per item, plus a short hold at the end so the
        // last chapter is readable before the pin releases.
        // +1 full viewport of dwell: the last item needs its own settled window
        // after the final slide, otherwise the pin releases the instant the fourth
        // photograph lands (measured: panel 4 still 765px below at 83% progress).
        // 7 viewports of pin for 4 items: each unit is 1.75 viewport of scroll,
        // so every photograph takes noticeably longer to travel than 1.375 did.
        // 4.8 viewports for 4 items: 1.2 viewport of scroll per item. Enough
        // travel for the slide to read, without making the reader wait.
        // 2.4 viewports for 4 items (0.6 each). The pinned stretch is meant to
        // be a beat, not a corridor: at 4.8 viewports the reader scrolled a long
        // way before the section ended, which read as the page being stuck.
        end: () => `+=${window.innerHeight * (count * 0.6)}`,
        pin: true,
        pinSpacing: true,
        // Damped rather than near-instant: the panel keeps easing for ~0.9s after
        // the wheel stops, which is what makes the move read as slow motion.
        // `true` = strictly 1:1 with the scroll position. The 0.9 here was a
        // damped follow that made every move feel laggy: the panel kept easing
        // for ~0.9s after the wheel stopped, so it arrived late.
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // The active item changes when the NEXT photograph starts sliding,
          // not at a plain equal-slice boundary. Using floor(progress * count)
          // switched the counter while the previous item was still fully
          // visible (measured: counter 02 with item 1's photo still on top).
          // Timeline units -> progress. Unit i spans [i, i+1) of count units.
          const units = self.progress * count;
          let idx = 0;
          for (let i = 1; i < count; i++) {
            if (units >= i - 1 + HOLD) idx = i;
          }
          setActive(idx);
        },
      },
    });

    // Timing model. Each item owns an equal slice of the timeline. Inside its
    // slice the item HOLDS first, then the next photograph slides in during the
    // last stretch. Without that hold the very first frame was already
    // mid-transition (measured: item 1 showed "SMOKY HEAT" at 23% scroll), so
    // no item was ever readable on its own.
    //
    // Chapters are NOT animated here. They are swapped by the .is-active class
    // from setActive(); GSAP autoAlpha on the same nodes fought the CSS class
    // (inline style always wins) and produced a blank panel at 48%.
    // Each item owns one unit; the slide into item i happens inside unit i-1.
    // Timings are in whole units (not fractions of 1) so totalDuration is exactly
    // `count` and there is no dead tail. The previous version put the last slide
    // at 0.6575 of a 1.0 timeline while the pin still had 34% travel left, so
    // item 4 never finished arriving (measured: panel 4 at 765px, 83% progress).
    for (let i = 1; i < count; i++) {
      const slideAt = i - 1 + HOLD;
      const slideDur = 1 - HOLD;

      tl.fromTo(
        panels[i],
        { yPercent: 100 },
        { yPercent: 0, duration: slideDur },
        slideAt,
      );
    }


    // Hold the final item for a full unit. Without this the timeline ends the
    // moment the fourth photograph lands, so the pin released instantly and the
    // last chapter was never readable on its own (measured: panel 4 still 765px
    // below at 85% of the pin). This empty tween extends totalDuration by 1 unit,
    // which the scroll distance is derived from.
    tl.to({}, { duration: 1 }, `+=0`);
    return () => {
      gsap.set(panels, { clearProps: 'transform,opacity,visibility,zIndex' });
      gsap.set(chapters, { clearProps: 'opacity,visibility,transform' });
    };
  });

  /* ══════════════════════════════════════════════════════════════════════
     FLOW — tablet, mobile, reduced motion
     ══════════════════════════════════════════════════════════════════════ */
  mm.add('(max-width: 1023px), (prefers-reduced-motion: reduce)', () => {
    setActive(0);

    // Undo any pinned-state transforms, then everything is simply visible.
    gsap.set(panels, { clearProps: 'transform,opacity,visibility,zIndex' });
    gsap.set(chapters, { clearProps: 'opacity,visibility,transform' });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    // Short, restrained fade-up per block. No pin, no long storytelling.
    // gsap.from() with once:true stranded the panels at opacity 0: when an
    // element was already past its trigger point at measure time the tween
    // never played (measured: all four panels reported 0.00 at 375 and 768
    // while the chapters were visible). Explicit set + fromTo is order-safe.
    root.querySelectorAll<HTMLElement>('.rk-sig__chapter, .rk-sig__panel').forEach((el) => {
      gsap.set(el, { opacity: 1 });
      gsap.fromTo(
        el,
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: 'power2.out',
          immediateRender: false,
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        },
      );
    });

    return () => {
      gsap.set(panels, { clearProps: 'transform,opacity,visibility,zIndex' });
      gsap.set(chapters, { clearProps: 'opacity,visibility,transform' });
    };
  });

  return () => mm.revert();
}

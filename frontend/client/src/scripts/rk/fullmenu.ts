/**
 * Ruby Kitchen 81 — THE RUBY MENU (interactive flipbook section).
 *
 * The book IS the interface: StPageFlip renders the paper, spine and page turns,
 * and this module only builds the host, mounts the book and wires the controls.
 *
 * OWNERSHIP
 *   StPageFlip  page shape, turning, drag-to-peel
 *   GSAP        the section's entrance only (opacity/y on the WRAPPER, never on
 *               a page element, so the two never fight over the same transform)
 *
 * The section is NOT pinned and does not intercept the wheel: the page keeps
 * scrolling normally, and the book only turns when the user asks it to.
 */
import { gsap, ScrollTrigger } from '../motion/gsap';
import { content } from '../../content/en';
import { createFlipbook } from './flipbook';
import type { FlipbookHandle } from './flipbook';

const { fullMenu } = content;
const insideCount = fullMenu.pages.length - 1; // Menu1..Menu6

export function fullMenuMarkup(): string {
  return `
  <section class="rk-fb" id="full-menu" data-rk-fb>
    <div class="rk-wrap">
      <header class="rk-fb__head">
        <p class="rk-eyebrow rk-fb__eyebrow">${fullMenu.eyebrow}</p>
        <h2 class="rk-fb__title rk-display">${fullMenu.heading}</h2>
        <p class="rk-fb__sub">${fullMenu.sub}</p>
      </header>

      <!-- The arrows live in the SAME flex row as the book and are vertically
           centred on it, so they read as part of the reading surface instead of
           a separate control bar underneath. The page counter was removed on
           request — the turned pages are the indicator now. -->
      <div class="rk-fb__stage">
        <button class="rk-fb__arrow rk-fb__arrow--prev" type="button" data-rk-fb-prev aria-label="${fullMenu.prevLabel}">
          <span aria-hidden="true">←</span>
        </button>

        <div class="rk-fb__bookwrap">
          <!-- StPageFlip fills this element with pages. -->
          <div class="rk-fb__book" data-rk-fb-book aria-label="Ruby Kitchen 81 menu book"></div>

          <!-- Click target for the closed cover: the library cannot open the book
               from a click on the cover board, so an explicit control sits over it. -->
          <button class="rk-fb__open" type="button" data-rk-fb-open hidden>
            ${fullMenu.openLabel}
          </button>
        </div>

        <button class="rk-fb__arrow rk-fb__arrow--next" type="button" data-rk-fb-next aria-label="${fullMenu.nextLabel}">
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  </section>`;
}

export function initFullMenu(): () => void {
  const root = document.querySelector<HTMLElement>('[data-rk-fb]');
  if (!root) return () => {};

  const host = root.querySelector<HTMLElement>('[data-rk-fb-book]');
  const prev = root.querySelector<HTMLButtonElement>('[data-rk-fb-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-rk-fb-next]');
  const openBtn = root.querySelector<HTMLButtonElement>('[data-rk-fb-open]');
  if (!host) return () => {};

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let handle: FlipbookHandle | null = null;
  let animating = false;
  const cleanups: Array<() => void> = [];

  /* ── Mount ─────────────────────────────────────────────────────────── */
  // The library measures its host on construction, so the element must already
  // have its final size. Waiting a frame guarantees layout has settled.
  const mount = () => {
    handle = createFlipbook(host);
    if (!handle) return;

    /* StPageFlip indexes PHYSICAL pages, not menu pages. With showCover the
       front board is its own physical page, and each spread advances the index
       by two (left + right), which is why a naive read produced 01 -> 03 -> 05.
       The menu page being shown is therefore the index mapped back onto the
       pages[] array, and the indicator counts distinct spreads. */
    /* Only two things need syncing now that the counter is gone: whether the
       book is closed (so the Open button is visible) and whether either arrow is
       at an end. Page numbers are deliberately not shown — the turned pages are
       the indicator. */
    const SYNC = (e: Event) => {
      const raw = (e as CustomEvent<{ page: number }>).detail?.page ?? 0;
      const open = raw >= 1;
      if (openBtn) openBtn.hidden = open;
      if (prev) prev.disabled = raw <= 0;
      if (next) next.disabled = raw >= insideCount;
    };
    host.addEventListener('rk:flip', SYNC);
    cleanups.push(() => host.removeEventListener('rk:flip', SYNC));

    // The library fires 'init' asynchronously; paint once immediately too so the
    // closed-cover state is right before any flip happens.
    host.dispatchEvent(new CustomEvent('rk:flip', { detail: { page: 0, total: insideCount } }));

    /* ── Controls ────────────────────────────────────────────────────── */

    const doNext = () => {
      if (animating) return;
      animating = true;
      handle?.next();
      window.setTimeout(() => (animating = false), reduced ? 30 : 720);
    };
    const doPrev = () => {
      if (animating) return;
      animating = true;
      handle?.prev();
      window.setTimeout(() => (animating = false), reduced ? 30 : 720);
    };

    next?.addEventListener('click', doNext);
    prev?.addEventListener('click', doPrev);
    cleanups.push(() => {
      next?.removeEventListener('click', doNext);
      prev?.removeEventListener('click', doPrev);
    });

    /* ── Open button (closed cover) ──────────────────────────────────── */
    const doOpen = () => {
      if (animating) return;
      animating = true;
      handle?.next();
      window.setTimeout(() => (animating = false), reduced ? 30 : 720);
    };
    openBtn?.addEventListener('click', doOpen);
    cleanups.push(() => openBtn?.removeEventListener('click', doOpen));

    /* ── Keyboard ────────────────────────────────────────────────────── */
    const onKey = (e: KeyboardEvent) => {
      // Only when focus is inside this section, so the page keeps its own keys.
      if (!root.contains(document.activeElement)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        doNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        doPrev();
      }
    };
    document.addEventListener('keydown', onKey);
    cleanups.push(() => document.removeEventListener('keydown', onKey));
  };

  // Wait one frame for layout, then mount.
  const raf = requestAnimationFrame(() => {
    mount();

    if (reduced) {
      gsap.set('.rk-fb__head, .rk-fb__stage', { opacity: 1, clearProps: 'transform' });
      return;
    }

    // Entrance animation — wrapper elements only.
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: root, start: 'top 72%', once: true },
      });
      tl.from('.rk-fb__eyebrow', { opacity: 0, y: 10, duration: 0.4 })
        .from('.rk-fb__title', { opacity: 0, y: 22, duration: 0.7 }, 0.05)
        .from('.rk-fb__sub', { opacity: 0, y: 14, duration: 0.5 }, 0.25)
        .from('.rk-fb__stage', { opacity: 0, y: 28, scale: 0.97, duration: 0.9 }, 0.3);
    }, root);
    cleanups.push(() => ctx.revert());
  });

  return () => {
    cancelAnimationFrame(raf);
    cleanups.splice(0).forEach((fn) => {
      try {
        fn();
      } catch {
        /* teardown must never throw */
      }
    });
    handle?.destroy();
    handle = null;
  };
}

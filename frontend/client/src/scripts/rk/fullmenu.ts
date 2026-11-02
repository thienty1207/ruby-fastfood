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

      <!-- Arrows flank the book in the same flex row and are vertically
           centred on it. The page counter is gone: the turned pages are the
           indicator. -->
      <div class="rk-fb__stage">
        <button class="rk-fb__arrow rk-fb__arrow--prev" type="button" data-rk-fb-prev aria-label="${fullMenu.prevLabel}">
          <span aria-hidden="true">←</span>
        </button>

        <div class="rk-fb__bookwrap">
          <!-- StPageFlip fills this element with pages. -->
          <div class="rk-fb__book" data-rk-fb-book aria-label="Ruby Kitchen 81 menu book"></div>

          <!-- Only visible while the book is closed. It sits BELOW the cover,
               not over it, so the closed state still reads as a cover. Clicking
               the cover itself also opens the book (see fullmenu.ts). -->
          <button class="rk-fb__open is-hidden" type="button" data-rk-fb-open>
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
    /* CENTRING A SINGLE VISIBLE BOARD.
       StPageFlip always lays out a full spread, then shows only one board while
       the book is closed or at its very end. That lone board sat 131px right of
       the stage centre when closed and 132px left at the end (measured), which is
       what made the cover look off-centre at both extremes.

       Rather than compute the offset from a half/quarter of the wrapper — which
       still drifted a few px because of the stage gaps and the library landing its
       flip event before layout settles — this MEASURES the visible board against
       the stage and translates the wrapper by exactly the difference. Runs twice:
       once synchronously and once on the next frame. */
    /* CENTRING A SINGLE VISIBLE BOARD.
       StPageFlip always lays out a full spread, then shows only one board while
       the book is closed or at its very end. That lone board sat 131px right of
       the stage centre when closed and 132px left at the end (measured), so the
       cover looked off-centre at both extremes.

       The correction is applied as margin-left rather than transform: the library
       rewrites the wrapper transform during a flip, which quietly undid a
       translateX set from here. It is then run as a short converging loop, because
       each measurement happens before the previous margin has been laid out — a
       single pass left 5-6px of drift, a second pass closes it. */
    /* CENTRING THE VISIBLE PAGE GROUP.
       StPageFlip always lays out a full two-page spread inside .stf__wrapper.
       Closed and at the very end only ONE board is visible, so the wrapper needs
       shifting; while reading, TWO boards are visible and the spread already fills
       the wrapper.

       The correction must therefore measure the UNION of whatever boards are
       showing, not the first one. Measuring boards[0] centred the LEFT page while a
       spread was open and pushed the whole spread 179px to the right (measured:
       group centre 908 vs stage centre 729). Taking the min-left / max-right of all
       visible boards is correct for one board and for two.

       margin-left rather than transform: the library rewrites the wrapper transform
       during a flip and silently undid a translateX set here. It converges in a
       short loop because each measurement lands before the previous margin has been
       laid out (a single pass left 5-6px). */
    const centreWrapper = () => {
      const align = () => {
        const wrap = host.querySelector<HTMLElement>('.stf__wrapper');
        const stage = host.closest<HTMLElement>('.rk-fb__stage');
        if (!wrap || !stage) return;

        const boards = [...host.querySelectorAll<HTMLElement>('.stf__item')].filter(
          (el) => getComputedStyle(el).display !== 'none',
        );
        if (!boards.length) return;

        let margin = parseFloat(wrap.style.marginLeft || '0');
        for (let pass = 0; pass < 4; pass++) {
          const sr = stage.getBoundingClientRect();

          // Union of every visible board — one page, or the whole spread.
          let left = Infinity;
          let right = -Infinity;
          for (const el of boards) {
            const r = el.getBoundingClientRect();
            if (r.width === 0) continue;
            if (r.left < left) left = r.left;
            if (r.right > right) right = r.right;
          }
          if (!Number.isFinite(left) || !Number.isFinite(right)) return;

          const delta = sr.left + sr.width / 2 - (left + right) / 2;
          if (Math.abs(delta) < 0.5) break;
          margin += delta;
          wrap.style.marginLeft = `${margin}px`;
        }
      };

      align();
      requestAnimationFrame(align);
      window.setTimeout(align, 300);
    };

    /* Match the one-page threshold used by createFlipbook. */
    const isMobileBook = () => {
      const stage = host.closest<HTMLElement>('.rk-fb__stage');
      return (stage?.getBoundingClientRect().width ?? window.innerWidth) < 720;
    };
    const primePageImage = (page: number) => handle?.preparePage(page) ?? Promise.resolve();

    const SYNC = (e: Event) => {
      const raw = (e as CustomEvent<{ page: number }>).detail?.page ?? 0;
      const open = raw >= 1;
      if (openBtn) openBtn.classList.toggle('is-hidden', open);
      if (prev) prev.disabled = raw <= 0;
      if (next) next.disabled = raw >= insideCount;
      centreWrapper();
      if (isMobileBook()) {
        void primePageImage(raw);
        void primePageImage(raw + 1);
      }
    };
    host.addEventListener('rk:flip', SYNC);
    cleanups.push(() => host.removeEventListener('rk:flip', SYNC));

    // The library fires 'init' asynchronously; paint once immediately too so the
    // closed-cover state is right before any flip happens.
    host.dispatchEvent(new CustomEvent('rk:flip', { detail: { page: 0, total: insideCount } }));

    /* ── Controls ────────────────────────────────────────────────────── */

    const animateMobileTurn = (direction: 'next' | 'prev') => {
      if (reduced || typeof host.animate !== 'function') return;

      const offset = direction === 'next' ? 14 : -14;
      host.animate(
        [
          { opacity: 0.55, transform: `translate3d(${offset}px, 0, 0)` },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ],
        { duration: 180, easing: 'ease-out' },
      );
    };
    const startTurn = (direction: 'next' | 'prev') => {
      const mobile = isMobileBook();
      const turn = () => {
        if (direction === 'next') handle?.next();
        else handle?.prev();

        if (mobile) animateMobileTurn(direction);
        window.setTimeout(() => (animating = false), reduced ? 30 : mobile ? 220 : 720);
      };

      if (mobile && direction === 'next') {
        void primePageImage((handle?.current() ?? 0) + 1).then(turn);
      } else {
        turn();
      }
    };
    const doNext = () => {
      if (animating) return;
      animating = true;
      startTurn('next');
    };
    const doPrev = () => {
      if (animating) return;
      animating = true;
      startTurn('prev');
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
      startTurn('next');
    };
    openBtn?.addEventListener('click', doOpen);
    cleanups.push(() => openBtn?.removeEventListener('click', doOpen));

    /* Clicking the closed COVER opens the book. StPageFlip's own click handling is
       switched off (disableFlipByClick), so without this the only way in is the
       button.

       The guard is the button's own class: SYNC removes `is-hidden` while the book
       is closed and adds it once reading starts, so the book may only be opened
       while that class is ABSENT. This condition was inverted, which meant a click
       or a drag anywhere on an OPEN book called flipNext() and turned a page — the
       "drag to flip" that was supposed to be off. */
    const onBookClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-rk-fb-open]')) return; // the button handles itself
      if (openBtn?.classList.contains('is-hidden')) return; // already open
      doOpen();
    };
    host.addEventListener('click', onBookClick);
    cleanups.push(() => host.removeEventListener('click', onBookClick));

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

    /* ── Rebuild on a real width change ──────────────────────────────────
       StPageFlip bakes the page size in at construction, so a phone rotating — or a
       window crossing the wide/narrow threshold — would otherwise keep the OLD
       geometry. That is how a phone ended up drawing the LANDSCAPE spread with both
       edges cropped (two columns of text cut off), instead of one centred page.

       Guarded on a width change >40px: on mobile the address bar showing/hiding
       fires resize with a height-only change, which must not tear the book down
       mid-read. Debounced because resize fires continuously while dragging. */
    let lastW = window.innerWidth;
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const w = window.innerWidth;
        if (Math.abs(w - lastW) < 40) return; // height-only change
        lastW = w;
        const page = handle?.current() ?? 0;
        handle?.destroy();
        handle = createFlipbook(host);
        if (!handle) return;
        // Keep the reading position across a rotation, never snap back to cover.
        for (let i = 0; i < page; i++) handle.next();
        // Re-run the controller sync so the arrows and Open button match.
        host.dispatchEvent(new CustomEvent('rk:flip', { detail: { page } }));
      }, 220);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    cleanups.push(() => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    });

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

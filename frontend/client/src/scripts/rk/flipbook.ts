/**
 * Ruby Kitchen 81 — interactive flipbook menu.
 *
 * StPageFlip owns page turning entirely: it builds the paper, the spine, the
 * curvature and the drag-to-peel corners. This module only feeds it DOM pages and
 * wires the controls. GSAP is deliberately NOT used on any page element — see the
 * note on the entrance animation in fullmenu.ts.
 *
 * PAGE MODEL
 *   page 0  front cover        (Menu)        — hard, shown alone when closed
 *   page 1  inside            (Menu1)
 *   page 2  inside            (Menu2)
 *   page 3  inside            (Menu3)
 *   page 4  inside            (Menu4)
 *   page 5  inside            (Menu5)
 *   page 6  inside            (Menu6)        — an inside page, NOT the back cover
 *   page 7  back cover        (CSS)          — hard, closes the book
 *
 * Menu6 is an inside page. Treating it as the back cover (as a naive
 * images-only load would, because showCover marks the LAST page as hard) would
 * have made the drinks page the hard back board.
 */
import { PageFlip } from 'page-flip';
import type { FlipSetting, SizeType } from 'page-flip';
import { content } from '../../content/en';

const pages = content.fullMenu.pages;

type Flip = InstanceType<typeof PageFlip>;

export interface FlipbookHandle {
  /** Turn forward one page/spread. */
  next: () => void;
  /** Turn back one page/spread. */
  prev: () => void;
  /** Index of the page currently on the left of the spread. */
  current: () => number;
  destroy: () => void;
}

/** Build the page elements StPageFlip will consume. */
function buildPages(): HTMLElement[] {
  const make = (cls: string, inner: string) => {
    const el = document.createElement('div');
    el.className = `rk-fb-page ${cls}`;
    el.innerHTML = inner;
    return el;
  };

  const out: HTMLElement[] = [];

  // Front cover — the printed cover artwork, full bleed.
  out.push(
    make(
      'rk-fb-page--cover rk-fb-page--hard',
      `<img src="${pages[0].src}" alt="${pages[0].alt}" width="1055" height="1491" decoding="async" draggable="false" />`,
    ),
  );

  // Six inside pages. `lazy` after the first so the cover is never delayed.
  for (let i = 1; i < pages.length; i++) {
    const p = pages[i];
    if (!p) continue;
    out.push(
      make(
        'rk-fb-page--inner',
        `<img src="${p.src}" alt="${p.alt}" width="1055" height="1491" loading="lazy" decoding="async" draggable="false" />`,
      ),
    );
  }

  // Back cover — a structural board, not a menu page.
  out.push(
    make(
      'rk-fb-page--back rk-fb-page--hard',
      `<span class="rk-fb-backmark" aria-hidden="true">RUBY KITCHEN 81</span>`,
    ),
  );

  return out;
}

/**
 * Mount a flipbook into `host`.
 *
 * `size: 'stretch'` makes StPageFlip derive the book size from the host box, so
 * the caller controls the footprint (and therefore mobile vs desktop) purely with
 * CSS. That avoids the library fighting our breakpoints.
 */
export function createFlipbook(host: HTMLElement): FlipbookHandle | null {
  if (!host) return null;

  const nodes = buildPages();
  // StPageFlip wants the pages in the DOM before loadFromHTML.
  host.replaceChildren(...nodes);

  const stageBox = host.closest('.rk-fb__stage')?.getBoundingClientRect();
  /* Geometry is computed here instead of `size: 'stretch'`: with stretch the
     library measured the host after it had begun writing its own inline sizes and
     the book grew to 1354x1913 inside a 1440px viewport with nothing visible.

     MODE IS DECIDED FROM THE MEASURED STAGE WIDTH, not window.innerWidth. On a
     phone innerWidth reported a desktop-sized value while the section was still
     laying out (or mid orientation change), so the book came up in LANDSCAPE:
     two tiny pages side by side, cropped off both screen edges — the broken
     mobile layout. The stage box is already laid out when this runs, so it
     cannot lie about the space actually available.

       wide stage (>=900)   landscape, two facing pages (spread = 2 x pageW)
       narrow stage         portrait, one page at a time (spread = 1 x pageW) */
  const stageW = stageBox?.width ?? window.innerWidth;
  // Threshold tuned to the MEASURED stage, not the viewport: at a 900px viewport the
  // stage is only ~821px wide (the .rk-wrap gutter eats the rest), so a 900 threshold
  // wrongly dropped that size into portrait. 720 keeps tablets on the two-page spread
  // and only phones in single-page mode.
  const isWide = stageW >= 720;
  // Subtract the two arrows and their gaps so the spread fits between them.
  const arrowCol = 2 * (isWide ? 60 : 46);
  const availW = Math.max(140, Math.round(stageW - arrowCol));
  const PAGE_RATIO = 1491 / 1055; // height / width

  // Vertical room: viewport minus the navbar, the section head, the Open button
  // (which sits in flow below the book) and the shadow.
  const budgetH = Math.max(240, window.innerHeight - (isWide ? 300 : 320));

  // Wide: the width is the limit because two pages share it. Narrow: the height
  // is, because a single page may be as wide as the column.
  const pageW = isWide
    ? Math.max(140, Math.min(Math.round(availW / 2), Math.round(budgetH / PAGE_RATIO)))
    : Math.max(140, Math.min(Math.round(availW), Math.round(budgetH / PAGE_RATIO)));
  const pageH = Math.round(pageW * PAGE_RATIO);
  /* StPageFlip replaces the host's children and writes its own inline min-width
     onto it on init. Give the host an explicit spread width first, otherwise it
     collapses to that min-width and the book renders at page size instead of
     spread size. */
  host.style.width = `${isWide ? pageW * 2 : pageW}px`;
  host.style.height = `${pageH}px`;

  const settings: Partial<FlipSetting> = {
    // 0 = closed on the cover. The book opens on the first flip.
    startPage: 0,
    // Cast rather than importing the enum: verbatimModuleSyntax forbids ambient
    // const enums (TS2748), and the library only accepts these two strings.
    size: 'fixed' as SizeType,
    width: pageW,
    height: pageH,
    minWidth: pageW,
    maxWidth: pageW,
    minHeight: pageH,
    maxHeight: pageH,
    drawShadow: true,
    flippingTime: 900,
    usePortrait: true,
    startZIndex: 0,
    autoSize: false,
    maxShadowOpacity: 0.55,
    // First AND last page treated as hard boards: that is exactly the front and
    // back cover we constructed above.
    showCover: true,
    mobileScrollSupport: true,
    /* Pointer interaction is OFF by design. The section is driven by the two
       arrow buttons and the Open button, so the extra affordances were noise:
       corner-hover peeled a page whenever the cursor crossed the book, and
       drag-to-flip let a stray drag turn a page while reading. With both off,
       StPageFlip only moves when flipNext()/flipPrev() is called. */
    useMouseEvents: false,
    swipeDistance: 24,
    showPageCorners: false,
    // A click anywhere on the book must NOT flip it either — only the arrows do.
    disableFlipByClick: true,
  };

  let flip: Flip;
  try {
    flip = new PageFlip(host, settings);
  } catch {
    return null;
  }

  flip.loadFromHTML(nodes);

  const total = pages.length; // inside pages, for the indicator
  const sync = () => {
    const idx = flip.getCurrentPageIndex();
    // A fresh event each time: CustomEvent.detail is read-only, and reusing one
    // instance would also mean listeners see a mutated object after the fact.
    host.dispatchEvent(new CustomEvent('rk:flip', { detail: { page: idx, total } }));
  };

  flip.on('flip', sync);
  flip.on('init', sync);

  return {
    next: () => flip.flipNext(),
    prev: () => flip.flipPrev(),
    current: () => flip.getCurrentPageIndex(),
    destroy: () => {
      /* PageFlip.destroy() calls block.remove() — it takes the HOST element out of
         the document. The caller keeps a reference to that host and expects it to
         stay in place, so the host is re-inserted into its parent immediately.
         Without this a rebuild (resize / orientation change) left the section with
         an empty box and no book at all — measured: 0 .rk-fb-page and 0 .stf__item
         after shrinking the viewport. */
      const parent = host.parentElement;
      const nextSibling = host.nextSibling;
      try {
        flip.destroy();
      } catch {
        /* already gone */
      }
      host.replaceChildren();
      host.removeAttribute('style');
      if (parent && !host.isConnected) parent.insertBefore(host, nextSibling);
    },
  };
}

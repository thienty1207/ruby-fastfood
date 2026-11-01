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

  /* Geometry is computed here instead of `size: 'stretch'`: with stretch the
     library measured the host after it had begun writing its own inline sizes and
     the book grew to 1354x1913 inside a 1440px viewport with nothing visible.

     TWO MODES:
       >= 1024px  landscape, two facing pages (spread = 2 x pageW)
       <  1024px  portrait, one page at a time (spread = 1 x pageW)
     The page is sized from whichever dimension is scarce, so a phone gets a
     tall readable page instead of a wide, uselessly short one. */
  // Measure the STAGE, not the immediate parent: the parent is the flex item
  // that shrinks around the host, so reading it produced 136px and the book
  // computed a 140px page.
  const stageBox = host.closest('.rk-fb__stage')?.getBoundingClientRect();
  // Subtract the two arrows and their gaps so the spread fits between them.
  const arrowCol = 2 * 60;
  const availW = Math.max(260, Math.round((stageBox?.width ?? 880) - arrowCol));
  const isWide = window.innerWidth >= 1024;
  const PAGE_RATIO = 1491 / 1055; // height / width

  // Vertical room: viewport minus navbar, section head, controls and padding.
  // Room for the navbar, the section head and the drop shadow. The arrows sit
  // beside the book now rather than below it, so ~330 is enough on desktop.
  // The Open button sits in flow BELOW the book now, so it needs its own slice of
  // the budget: ~56px of button plus margin.
  const budgetH = Math.max(240, window.innerHeight - (isWide ? 410 : 380));
  // In landscape the width is the limit (two pages share it); in portrait the
  // height is, because a single page can be as wide as the column.
  const pageW = isWide
    ? Math.max(140, Math.min(Math.round(availW / 2), Math.round((budgetH / PAGE_RATIO))))
    : Math.max(150, Math.min(Math.round(availW), Math.round(budgetH / PAGE_RATIO)));
  const pageH = Math.round(pageW * PAGE_RATIO);
  /* StPageFlip replaces the host's children and, on init, writes its own inline
     min-width onto the host. Give the host an explicit width first, otherwise it
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
    clickEventForward: false,
    // Drag-to-peel with the pointer, plus corner hover.
    useMouseEvents: true,
    swipeDistance: 24,
    showPageCorners: true,
    // Let a click anywhere flip; the controls are separate buttons outside.
    disableFlipByClick: false,
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
      try {
        flip.destroy();
      } catch {
        /* already gone */
      }
      host.replaceChildren();
    },
  };
}

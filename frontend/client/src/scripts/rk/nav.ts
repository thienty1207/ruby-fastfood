/**
 * Ruby Kitchen 81 — navigation.
 *
 * New implementation, replaces CRAV's nav. Deliberately different from the
 * clone's:
 *   - wordmark is typeset RUBY KITCHEN 81 (no CRAV lettering, no text-stroke)
 *   - links are plain text with a flame underline sweep, not rolling labels
 *   - hamburger morphs to a checkerboard-backed full-screen menu on mobile
 *   - nav does NOT hide on scroll (client wants menu reachable at all times)
 */
import { content } from '../../content/en';
import { scrollToEl } from '../motion/lenis';

export function rubyNavMarkup(): string {
  const { brand, nav } = content;
  const externalAttrs = (href: string) =>
    href.startsWith('https://') ? ' target="_blank" rel="noopener noreferrer"' : '';

  const links = nav.links
    .map(
      (l) => `<li class="rk-nav__li">
        <a class="rk-nav__link" href="${l.href}"${externalAttrs(l.href)} data-rk-nav-link>
          <span>${l.label}</span>
        </a>
      </li>`,
    )
    .join('');

  return `
  <nav class="rk-nav" data-rk-nav aria-label="Primary">
    <div class="rk-nav__inner">
      <a class="rk-nav__brand" href="#top" aria-label="${brand.name} — home">
        <span class="rk-nav__brand-ruby">${brand.parts[0]}</span>
        <span class="rk-nav__brand-rest">${brand.parts[1]}<em>${brand.parts[2]}</em></span>
      </a>

      <ul class="rk-nav__links">${links}</ul>

      <div class="rk-nav__actions">
        <a class="rk-btn rk-btn--flame rk-nav__cta" href="${nav.cta.href}">${nav.cta.label}</a>
        <button
          class="rk-nav__burger"
          type="button"
          data-rk-burger
          aria-expanded="false"
          aria-controls="rk-mobile-menu"
          aria-label="${nav.menuOpenLabel}"
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>

  <!-- Mobile / small-screen menu: full-bleed, checkerboard edge -->
  <div class="rk-sheet" id="rk-mobile-menu" data-rk-sheet aria-hidden="true">
    <div class="rk-sheet__checker rk-checker" aria-hidden="true"></div>
    <div class="rk-sheet__body">
      <ul class="rk-sheet__links">
        ${nav.links
          .map(
            (l, i) =>
              `<li style="--i:${i}"><a href="${l.href}"${externalAttrs(l.href)} data-rk-sheet-link>${l.label}</a></li>`,
          )
          .join('')}
      </ul>
      <div class="rk-sheet__foot">
        <a class="rk-btn rk-btn--flame" href="${nav.cta.href}" data-rk-sheet-link>${nav.cta.label}</a>
        <a class="rk-sheet__phone" href="${content.contact.phoneHref}">${content.contact.phone}</a>
      </div>
    </div>
  </div>`;
}

/**
 * Wire behaviour. All listeners are registered once and torn down by the
 * returned cleanup, so there is no duplicate-listener risk on re-mount.
 */
export function initRubyNav(): () => void {
  const nav = document.querySelector<HTMLElement>('[data-rk-nav]');
  const burger = document.querySelector<HTMLButtonElement>('[data-rk-burger]');
  const sheet = document.querySelector<HTMLElement>('[data-rk-sheet]');
  if (!nav || !burger || !sheet) return () => {};

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sheetLinks = [...sheet.querySelectorAll<HTMLAnchorElement>('[data-rk-sheet-link]')];
  let open = false;

  const setOpen = (next: boolean) => {
    open = next;
    nav.classList.toggle('is-open', next);
    sheet.classList.toggle('is-open', next);
    sheet.setAttribute('aria-hidden', String(!next));
    burger.setAttribute('aria-expanded', String(next));
    burger.setAttribute(
      'aria-label',
      next ? content.nav.menuCloseLabel : content.nav.menuOpenLabel,
    );
    document.documentElement.classList.toggle('rk-locked', next);

    if (reduced || !sheetLinks.length) return;
    // staggered link rise, only when motion is allowed
    sheetLinks.forEach((a, i) => {
      a.style.transitionDelay = next ? `${0.06 + i * 0.045}s` : '0s';
    });
  };

  const onBurger = (e: MouseEvent) => {
    e.stopPropagation();
    setOpen(!open);
  };
  const onSheetLink = () => setOpen(false);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) setOpen(false);
  };
  const onResize = () => {
    // leaving mobile width closes the sheet so it can never trap scroll
    if (open && window.innerWidth > 900) setOpen(false);
  };

  burger.addEventListener('click', onBurger);
  sheetLinks.forEach((a) => a.addEventListener('click', onSheetLink));
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);

  // nav background solidifies once past the hero — cheap, single listener
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('is-scrolled', window.scrollY > 40);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // In-page links must scroll THROUGH Lenis when it is active. Calling
  // window.scrollTo({ behavior:'smooth' }) while Lenis owns the scroll position
  // starts a second animation on the same axis: the browser animates natively
  // while Lenis keeps interpolating toward its own target, producing a stutter
  // and sometimes a snap-back. scrollToEl() picks the right controller.
  const anchorHandlers: Array<{ el: HTMLAnchorElement; fn: (e: Event) => void }> = [];
  document.querySelectorAll<HTMLAnchorElement>('[data-rk-nav-link]').forEach((a) => {
    const fn = (e: Event) => {
      const href = a.getAttribute('href') ?? '';
      if (!href.startsWith('#')) return;
      if (href === '#top') {
        e.preventDefault();
        scrollToEl(document.body, 0);
        return;
      }
      // Resolve by id instead of passing the href to querySelector. The previous
      // form treated the fragment as a CSS selector: an id containing characters
      // that are meaningful in a selector (a space, a dot, a bracket) either threw
      // an uncaught SyntaxError or silently matched the wrong element. Today the
      // ids are literals from content/en.ts, so this changes nothing rendered —
      // it removes a trap that only appears once an anchor is generated.
      const id = href.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      scrollToEl(target, nav.offsetHeight + 8);
    };
    a.addEventListener('click', fn);
    anchorHandlers.push({ el: a, fn });
  });

  return () => {
    anchorHandlers.forEach(({ el, fn }) => el.removeEventListener('click', fn));
    burger.removeEventListener('click', onBurger);
    sheetLinks.forEach((a) => a.removeEventListener('click', onSheetLink));
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', onScroll);
    document.documentElement.classList.remove('rk-locked');
  };
}

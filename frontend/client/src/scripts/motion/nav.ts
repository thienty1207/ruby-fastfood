// Nav — hide-on-scroll-down, hamburger morph, menu panel, scroll-spy for dark sections.
// Port of chunk 0jg2m1sj81gv0.js. All values CONFIRMED from that source.
import { gsap, ScrollTrigger } from './gsap';
import { onLenisScroll, startLenis, stopLenis } from './lenis';
import { PILL, rolling, escapeHtml } from './ui';

const MENU_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '#about' },
  { label: 'Our Spices', href: '/spices' },
  { label: 'Locations', href: '#map' },
  { label: 'Contact', href: '/contact' },
];

export function navMarkup(): string {
  return `
  <div data-menu-backdrop class="fixed inset-0 z-998 bg-red/30 backdrop-blur-md" style="opacity:0;pointer-events:none"></div>
  <nav data-nav class="fixed top-0 left-0 w-full z-999 flex items-center justify-between px-[2.5vw] max-md:px-[4vw] py-[1vw] max-md:py-[4vw]">
    <a data-nav-logo href="/" class="font-modak hover:scale-105 transition-all duration-300 text-red text-stroke-small text-[4vw] max-md:text-[10vw] leading-none">CRAV</a>
    <div class="flex items-center gap-[1vw] max-md:gap-[3vw]">
      <a data-cursor-hide="true" href="/menu" class="${PILL.red}">${rolling('Burgers')}</a>
      <div class="relative">
        <button data-menu-toggle data-cursor-hide="true" aria-label="Toggle menu" aria-expanded="false" aria-controls="main-menu"
          class="hover:scale-105 flex items-center gap-[.6vw] max-md:gap-[2vw] px-[1.4vw] py-[.5vw] max-md:px-[4vw] group max-md:py-[1.8vw] rounded-full cursor-pointer transition-all duration-400 border-[.15vw] max-md:border-[.4vw] bg-transparent border-black/20 hover:border-black">
          <span data-menu-label class="font-mouse-memoirs flex items-center justify-center uppercase text-[1.3vw] max-md:text-[4vw] tracking-wide transition-colors duration-300 text-black">Menu</span>
          <div class="relative shrink-0 w-[1.2vw] h-[1.2vw] max-md:w-[3.5vw] max-md:h-[3.5vw]" aria-hidden="true">
            <span data-bar-top class="bg-black absolute left-0 top-0 block w-full h-[.15vw] max-md:h-[.5vw] rounded-full origin-center"></span>
            <span data-bar-mid class="bg-black absolute left-0 top-1/2 block w-[70%] h-[.15vw] max-md:h-[.5vw] rounded-full origin-center -translate-y-1/2"></span>
            <span data-bar-bot class="bg-black absolute left-0 bottom-0 block w-full h-[.15vw] max-md:h-[.5vw] rounded-full origin-center"></span>
          </div>
        </button>
        <div data-menu-panel id="main-menu" role="menu"
          class="absolute top-[calc(100%+1vw)] right-0 w-[18vw] max-md:w-[91vw] bg-red rounded-[1.2vw] max-md:rounded-[4vw] p-[2vw] max-md:mt-[5vw] max-md:p-[6vw] shadow-[0_1vw_3vw_rgba(27,27,27,.25)]"
          style="opacity:0;scale:.3;transform-origin:top right;pointer-events:none">
          <div data-menu-items class="flex flex-col gap-[.6vw] max-md:gap-[2vw]">
            ${MENU_ITEMS.map(
              (m) => `<a role="menuitem" data-menu-item href="${m.href.startsWith('#') ? '/' : m.href}"
                class="font-modak text-[2.4vw] max-md:text-[8vw] text-beige leading-[1.1] uppercase hover:text-mustard hover:scale-105 transition-transform duration-300 transform inline-block">${escapeHtml(m.label)}</a>`,
            ).join('')}
          </div>
          <div class="mt-[1.5vw] max-md:mt-[4vw] pt-[1vw] max-md:pt-[3vw] border-t border-beige/20">
            <p class="font-mouse-memoirs text-[.9vw] max-md:text-[3.5vw] text-beige/85 uppercase tracking-[.2em]">Est. 1997 — Navarra, España</p>
          </div>
        </div>
      </div>
    </div>
  </nav>`;
}

export function initNav(): void {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const backdrop = document.querySelector<HTMLElement>('[data-menu-backdrop]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const label = document.querySelector<HTMLElement>('[data-menu-label]');
  const panel = document.querySelector<HTMLElement>('[data-menu-panel]');
  const items = document.querySelectorAll<HTMLElement>('[data-menu-item]');
  const barTop = document.querySelector<HTMLElement>('[data-bar-top]');
  const barMid = document.querySelector<HTMLElement>('[data-bar-mid]');
  const barBot = document.querySelector<HTMLElement>('[data-bar-bot]');
  if (!nav || !toggle || !panel || !label || !barTop || !barMid || !barBot || !backdrop) return;

  // ---------- 1. hide on scroll down / reveal on scroll up ----------
  let open = false;
  let lastScroll = 0;
  let hidden = false;
  let navDark = false;

  gsap.set(nav, { willChange: 'transform' });

  const showNav = () => {
    if (!hidden) return;
    hidden = false;
    gsap.to(nav, { y: 0, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
  };

  onLenisScroll((scroll) => {
    if (open) {
      showNav();
      lastScroll = scroll;
      return;
    }
    const delta = scroll - lastScroll;

    // Guard the hide so a continuous downward scroll doesn't restart the tween,
    // but NEVER skip the lastScroll update — otherwise the reference point goes
    // stale and the nav can never be revealed again.
    if (scroll < 10) {
      showNav();
    } else if (delta > 6 && !hidden) {
      hidden = true;
      const h = nav.offsetHeight || 0;
      gsap.to(nav, { y: -(h + 12), duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
    } else if (delta < -6) {
      showNav();
    }

    lastScroll = scroll;
  });

  // ---------- 2. scroll-spy: white nav over dark sections ----------
  const darkSections = document.querySelectorAll('[data-nav-dark="true"]');
  const setDark = (v: boolean) => {
    navDark = v;
    const color = v ? 'bg-white' : open ? 'bg-beige' : 'bg-black';
    [barTop, barMid, barBot].forEach((b) => {
      b.classList.toggle('bg-white', v);
      b.classList.toggle('bg-black', !v && !open);
      b.classList.toggle('bg-beige', !v && open);
    });
    void color;
  };
  darkSections.forEach((s) => {
    ScrollTrigger.create({
      trigger: s,
      start: 'top 5%',
      end: 'bottom 5%',
      onEnter: () => setDark(true),
      onEnterBack: () => setDark(true),
      onLeave: () => setDark(false),
      onLeaveBack: () => setDark(false),
    });
  });

  // ---------- 3. hamburger morph (top/bottom bars to an X, middle collapses) ----------
  const buildBars = () => {
    gsap.set([barTop, barMid, barBot], { clearProps: 'transform,top,bottom,opacity,scaleX' });
    gsap.set(barTop, { top: 0, bottom: 'auto' });
    gsap.set(barMid, { opacity: 1, scaleX: 1 });
    gsap.set(barBot, { top: 'auto', bottom: 0 });

    const tl = gsap.timeline({ paused: true, defaults: { duration: 0.35, ease: 'power3.inOut' } });
    tl.to(barTop, { top: '50%', yPercent: -50, rotation: 45, transformOrigin: '50% 50%' }, 0)
      .to(barBot, { top: '50%', bottom: 'auto', yPercent: -50, rotation: -45, transformOrigin: '50% 50%' }, 0)
      .to(barMid, { opacity: 0, scaleX: 0, transformOrigin: '50% 50%' }, 0);
    return tl;
  };
  let bars = buildBars();

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const progress = bars.progress();
      bars = buildBars();
      bars.progress(progress);
    }, 120);
  });

  // ---------- 4. menu panel open/close ----------
  gsap.set(backdrop, { opacity: 0, pointerEvents: 'none' });
  gsap.set(panel, { opacity: 0, scale: 0.3, transformOrigin: 'top right' });

  const panelTl = gsap.timeline({ paused: true, defaults: { overwrite: 'auto' } });
  panelTl
    .add(() => gsap.set(backdrop, { pointerEvents: 'auto' }), 0)
    .to(backdrop, { opacity: 1, duration: 0.28, ease: 'power2.out' }, 0)
    .to(panel, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2.5)' }, 0.3)
    .fromTo(
      items,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.38, stagger: 0.06, ease: 'power3.out' },
      0.14,
    );
  panelTl.eventCallback('onReverseComplete', () => {
    gsap.set(backdrop, { pointerEvents: 'none' });
  });

  const setOpen = (v: boolean) => {
    open = v;
    toggle.setAttribute('aria-expanded', String(v));
    if (v) {
      panelTl.play();
      bars.play();
      stopLenis();
    } else {
      panelTl.reverse();
      bars.reverse();
      startLenis();
    }
    label.textContent = v ? 'Close' : 'Menu';
    // colour states
    toggle.classList.toggle('bg-red', v);
    toggle.classList.toggle('border-red', v);
    toggle.classList.toggle('bg-transparent', !v);
    toggle.classList.toggle('border-black/20', !v && !navDark);
    toggle.classList.toggle('hover:border-black', !v && !navDark);
    toggle.classList.toggle('border-white/20', !v && navDark);
    toggle.classList.toggle('hover:border-white', !v && navDark);
    label.classList.toggle('text-beige', v);
    label.classList.toggle('text-white', !v && navDark);
    label.classList.toggle('text-black', !v && !navDark);
    [barTop, barMid, barBot].forEach((b) => {
      b.classList.toggle('bg-beige', v);
      b.classList.toggle('bg-white', !v && navDark);
      b.classList.toggle('bg-black', !v && !navDark);
    });
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!open);
  });
  backdrop.addEventListener('click', () => setOpen(false));
  document.addEventListener('click', (e) => {
    if (!open) return;
    if (!panel.contains(e.target as Node) && !toggle.contains(e.target as Node)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setOpen(false);
  });

  // in-page links inside the panel: smooth scroll then close
  items.forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        e.preventDefault();
        setOpen(false);
        const sel = href === '#map' ? (window.matchMedia('(max-width: 1025px)').matches ? '#map-mobile' : '#map-desktop') : href;
        const target = document.querySelector(sel);
        if (target) {
          const offset = (nav?.offsetHeight ?? 0) + 12;
          import('./lenis').then(({ scrollToEl }) => scrollToEl(target, offset));
        }
      } else {
        setOpen(false);
      }
    });
  });

  document.querySelector('[data-nav-logo]')?.addEventListener('click', (e) => {
    const hero = document.querySelector('#hero');
    if (hero && window.location.pathname === '/') {
      e.preventDefault();
      const offset = (nav?.offsetHeight ?? 0) + 12;
      import('./lenis').then(({ scrollToEl }) => scrollToEl(hero, offset));
    }
  });
}
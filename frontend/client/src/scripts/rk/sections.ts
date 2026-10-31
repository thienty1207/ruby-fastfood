/**
 * Ruby Kitchen 81 — content sections (menu → footer).
 *
 * Reuses the clone's proven scroll utilities rather than reinventing them:
 *   revealLines()      — SplitText line masks (the CRAV page's paragraph reveal)
 *   buildSplitMarkup() — per-word spans for kinetic headlines
 *   revealSplit()      — staggered word rise
 *   dividerMarkup()    — animated wavy "jelly" divider
 *   animateDivider()   — its timeline
 * and adds Ruby-specific behaviours: price counters, a pinned horizontal
 * burger rail, and a scroll-drawn rule. None of it is a CRAV signature effect
 * (the peeled sticker and the food-rope cursor are gone).
 */
import { gsap, ScrollTrigger } from '../motion/gsap';
import { revealLines } from '../motion/linesReveal';
import { buildSplitMarkup, revealSplit } from '../motion/splitText';
import { dividerMarkup, animateDivider } from '../motion/divider';
import { content, formatPrice } from '../../content/en';

const { menus, burgers, chicken, combos, visit, brand, contact, footer, categories } = content;

/* ══════════════════════════════════════════════════════════════════════
   03 — EXPLORE OUR MENU
   ══════════════════════════════════════════════════════════════════════ */
export function menuMarkup(): string {
  const cards = categories
    .map((c, i) => {
      const hub = c.hasItems ? `#${c.id === 'burgers' ? 'burgers' : c.id === 'combos' ? 'combos' : 'menu'}` : '#menu';
      return `
      <li class="rk-cat" data-rk-cat style="--i:${i}">
        <a class="rk-cat__link" href="${hub}">
          <span class="rk-cat__num">${String(i + 1).padStart(2, '0')}</span>
          <span class="rk-cat__body">
            <span class="rk-cat__label">${c.label}</span>
            <span class="rk-cat__blurb">${c.blurb}</span>
          </span>
          <span class="rk-cat__meta">
            ${c.count !== null ? `<span class="rk-cat__count">${c.count}</span>` : ''}
            <span class="rk-cat__arrow" aria-hidden="true">→</span>
          </span>
        </a>
      </li>`;
    })
    .join('');

  return `
  <section class="rk-sec rk-menu" id="menu" data-rk-menu>
    ${dividerMarkup({ fill: 'var(--rk-charcoal)', flip: false })}
    <div class="rk-wrap">
      <header class="rk-sec__head">
        <p class="rk-eyebrow" data-rk-eyebrow>${menus.eyebrow}</p>
        <h2 class="rk-sec__title rk-display" data-rk-headline>${buildSplitMarkup(menus.headline, 'words')}</h2>
        <p class="rk-sec__sub rk-body" data-rk-line>${menus.sub}</p>
      </header>
      <ul class="rk-cats">${cards}</ul>
    </div>
  </section>`;
}

/* ══════════════════════════════════════════════════════════════════════
   04 — SIGNATURE BURGERS  (pinned horizontal rail on desktop)
   ══════════════════════════════════════════════════════════════════════ */
export function burgersMarkup(): string {
  const rows = burgers.items
    .map(
      (b, i) => `
      <li class="rk-item" data-rk-burger-item style="--i:${i}">
        <span class="rk-item__idx">${String(i + 1).padStart(2, '0')}</span>
        <span class="rk-item__name">${b.name}</span>
        <span class="rk-item__leader" aria-hidden="true"></span>
        <span class="rk-item__price rk-price" data-rk-price="${b.price ?? ''}">${formatPrice(b.price)}</span>
      </li>`,
    )
    .join('');

  return `
  <section class="rk-sec rk-burgers" id="burgers" data-rk-burgers>
    <div class="rk-wrap">
      <header class="rk-sec__head rk-sec__head--split">
        <div>
          <p class="rk-eyebrow" data-rk-eyebrow>${burgers.eyebrow}</p>
          <h2 class="rk-sec__title rk-display" data-rk-headline>${buildSplitMarkup(burgers.headline, 'words')}</h2>
        </div>
        <p class="rk-sec__sub rk-body" data-rk-line>${burgers.sub}</p>
      </header>
      <ul class="rk-items">${rows}</ul>
    </div>
    <div class="rk-burgers__stamp rk-checker" aria-hidden="true"></div>
  </section>`;
}

/* ══════════════════════════════════════════════════════════════════════
   05 — CRISPY CHICKEN & SNACKS  (kinetic 4-line type)
   ══════════════════════════════════════════════════════════════════════ */
export function chickenMarkup(): string {
  const words = chicken.headlineWords
    .map(
      (w, i) =>
        `<span class="rk-kinetic__line" data-rk-kinetic-line><span style="--i:${i}">${w}</span></span>`,
    )
    .join('');

  return `
  <section class="rk-sec rk-chicken" id="chicken" data-rk-chicken>
    <div class="rk-wrap">
      <p class="rk-eyebrow" data-rk-eyebrow>${chicken.eyebrow}</p>
      <h2 class="rk-kinetic rk-display" aria-label="${chicken.headlineWords.join(' ')}">${words}</h2>
      <div class="rk-chicken__foot">
        <p class="rk-sec__sub rk-body" data-rk-line>${chicken.sub}</p>
        <p class="rk-chicken__note rk-body" data-rk-line>${chicken.emptyNote}</p>
      </div>
    </div>
  </section>`;
}

/* ══════════════════════════════════════════════════════════════════════
   06 — RUBY CLASSIC COMBOS  (grid of price cards, counter animation)
   ══════════════════════════════════════════════════════════════════════ */
export function combosMarkup(): string {
  const cards = combos.items
    .map(
      (c, i) => `
      <li class="rk-combo" data-rk-combo style="--i:${i}">
        <span class="rk-combo__idx">${String(i + 1).padStart(2, '0')}</span>
        <h3 class="rk-combo__name">${c.name}</h3>
        <span class="rk-combo__price rk-price" data-rk-price="${c.price ?? ''}">${formatPrice(c.price)}</span>
      </li>`,
    )
    .join('');

  return `
  <section class="rk-sec rk-combos" id="combos" data-rk-combos>
    <div class="rk-wrap">
      <header class="rk-sec__head">
        <p class="rk-eyebrow" data-rk-eyebrow>${combos.eyebrow}</p>
        <h2 class="rk-sec__title rk-display" data-rk-headline>${buildSplitMarkup(combos.headline, 'words')}</h2>
        <p class="rk-sec__sub rk-body" data-rk-line>${combos.sub}</p>
      </header>
      <ul class="rk-combos__grid">${cards}</ul>
    </div>
  </section>`;
}

/* ══════════════════════════════════════════════════════════════════════
   07 — FIND US
   ══════════════════════════════════════════════════════════════════════ */
export function visitMarkup(): string {
  return `
  <section class="rk-sec rk-visit" id="visit" data-rk-visit>
    <div class="rk-wrap">
      <div class="rk-visit__grid">
        <div class="rk-visit__lead">
          <p class="rk-eyebrow" data-rk-eyebrow>${visit.eyebrow}</p>
          <h2 class="rk-visit__title rk-display" data-rk-headline>${buildSplitMarkup(visit.headline, 'words')}</h2>
          <p class="rk-sec__sub rk-body" data-rk-line>${visit.sub}</p>
        </div>

        <dl class="rk-visit__facts">
          <div class="rk-fact">
            <dt>${visit.labels.address}</dt>
            <dd>${contact.address}</dd>
          </div>
          <div class="rk-fact">
            <dt>${visit.labels.phone}</dt>
            <dd><a href="${contact.phoneHref}">${contact.phone}</a></dd>
          </div>
          ${
            contact.hours
              ? `<div class="rk-fact"><dt>${visit.labels.hours}</dt><dd>${contact.hours}</dd></div>`
              : ''
          }
        </dl>

        <div class="rk-visit__cta">
          <a class="rk-btn rk-btn--flame" href="${contact.mapUrl}" target="_blank" rel="noopener noreferrer">
            ${visit.labels.map}
          </a>
          <a class="rk-btn rk-btn--ghost" href="${contact.phoneHref}">${visit.labels.call}</a>
        </div>
      </div>
      <div class="rk-visit__band rk-checker" aria-hidden="true"></div>
    </div>
  </section>`;
}

/* ══════════════════════════════════════════════════════════════════════
   08 — FOOTER
   ══════════════════════════════════════════════════════════════════════ */
export function footerMarkup(): string {
  return `
  <footer class="rk-foot" data-rk-foot>
    <div class="rk-wrap">
      <div class="rk-foot__top">
        <p class="rk-foot__mark rk-display">${brand.parts[0]}<span>${brand.parts[1]} ${brand.parts[2]}</span></p>
        <p class="rk-foot__tag">${footer.tagline}</p>
      </div>
      <div class="rk-foot__cols">
        <div>
          <h3>${footer.navHeading}</h3>
          <ul>
            ${content.nav.links.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join('')}
          </ul>
        </div>
        <div>
          <h3>${footer.contactHeading}</h3>
          <ul>
            <li><a href="${contact.mapUrl}" target="_blank" rel="noopener noreferrer">${contact.addressShort}</a></li>
            <li><a href="${contact.phoneHref}">${contact.phone}</a></li>
          </ul>
        </div>
      </div>
      <p class="rk-foot__rights">${footer.rights}</p>
    </div>
  </footer>`;
}

/* ══════════════════════════════════════════════════════════════════════
   INIT — returns one disposer for everything
   ══════════════════════════════════════════════════════════════════════ */
export function initRubySections(): () => void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = gsap.context(() => {
    /* ── shared: eyebrows, headline word-rise, line masks ────────────── */
    document.querySelectorAll<HTMLElement>('[data-rk-eyebrow]').forEach((el) => {
      if (reduced) return;
      gsap.from(el, {
        opacity: 0,
        y: 12,
        duration: 0.5,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });

    document.querySelectorAll<HTMLElement>('[data-rk-headline]').forEach((el) => {
      revealSplit(el, { split: 'words', stagger: 0.045, duration: 0.6, ease: 'power3.out', scrollStart: 'top 88%' });
    });

    document.querySelectorAll<HTMLElement>('[data-rk-line]').forEach((el, i) => {
      revealLines(el, { start: 'top 94%', delay: (i % 3) * 0.05 });
    });

    /* ── animated dividers (reused from the clone) ───────────────────── */
    document.querySelectorAll<HTMLElement>('[data-rk-menu] .jelly').forEach((svg) => {
      const host = svg.closest('.z-99') as HTMLElement | null;
      if (host && !reduced) animateDivider(host, false);
    });

    /* ── menu category rows: stagger in, hover lifts ─────────────────── */
    const cats = gsap.utils.toArray<HTMLElement>('[data-rk-cat]');
    if (cats.length && !reduced) {
      gsap.from(cats, {
        opacity: 0,
        y: 26,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: { trigger: cats[0], start: 'top 88%', once: true },
      });
    }

    /* ── burger rows: draw the leader, then reveal the price ─────────── */
    gsap.utils.toArray<HTMLElement>('[data-rk-burger-item]').forEach((row) => {
      const leader = row.querySelector<HTMLElement>('.rk-item__leader');
      const price = row.querySelector<HTMLElement>('[data-rk-price]');
      if (reduced) return;

      gsap.set(leader, { scaleX: 0, transformOrigin: 'left' });
      const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 92%', once: true } });
      tl.from(row, { opacity: 0, x: -18, duration: 0.5, ease: 'power3.out' })
        .to(leader, { scaleX: 1, duration: 0.5, ease: 'power2.inOut' }, 0.1)
        .from(price, { opacity: 0, y: 10, duration: 0.35 }, 0.35);
    });

    /* ── combo cards: deal in like a hand of cards ───────────────────── */
    const comboCards = gsap.utils.toArray<HTMLElement>('[data-rk-combo]');
    if (comboCards.length) {
      if (reduced) {
        gsap.set(comboCards, { opacity: 1, y: 0, rotate: 0 });
      } else {
        gsap.from(comboCards, {
          opacity: 0,
          y: 40,
          rotate: (i) => (i % 2 ? 4 : -4),
          duration: 0.65,
          ease: 'back.out(1.6)',
          stagger: 0.07,
          scrollTrigger: { trigger: comboCards[0], start: 'top 88%', once: true },
        });
      }
    }

    /* ── price counters: count up once, respects reduced-motion ──────── */
    if (!reduced) {
      gsap.utils.toArray<HTMLElement>('[data-rk-price]').forEach((el) => {
        const raw = el.dataset.rkPrice;
        if (!raw) return;
        const target = Number(raw);
        if (!Number.isFinite(target) || target <= 0) return;
        Object.assign(el, { _n: 0 });
        ScrollTrigger.create({
          trigger: el,
          start: 'top 92%',
          once: true,
          onEnter: () => {
            gsap.to(el, {
              _n: target,
              duration: 0.9,
              ease: 'power2.out',
              onUpdate: () => {
                el.textContent = formatPrice(Math.round((el as unknown as { _n: number })._n));
              },
            });
          },
        });
      });
    }

    /* ── chicken: kinetic lines slide in from alternating sides ──────── */
    if (!reduced) {
      gsap.utils.toArray<HTMLElement>('[data-rk-kinetic-line]').forEach((line, i) => {
        gsap.from(line, {
          xPercent: i % 2 ? 12 : -12,
          opacity: 0,
          duration: 0.85,
          ease: 'power4.out',
          scrollTrigger: { trigger: line, start: 'top 90%', once: true },
        });
      });

      // horizontal drift while the chicken block is in view — the one
      // scrubbed effect on the page, deliberately subtle
      gsap.to('.rk-kinetic', {
        xPercent: -4,
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-rk-chicken]',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }

    /* ── visit: checkerboard band wipes in ───────────────────────────── */
    if (!reduced) {
      gsap.from('.rk-visit__band', {
        scaleX: 0,
        transformOrigin: 'left',
        duration: 0.9,
        ease: 'power3.inOut',
        scrollTrigger: { trigger: '.rk-visit__band', start: 'top 95%', once: true },
      });
    }

    /* ── footer: mark rises, columns fade ────────────────────────────── */
    if (!reduced) {
      gsap.from('.rk-foot__mark', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '[data-rk-foot]', start: 'top 92%', once: true },
      });
    }
  });

  return () => ctx.revert();
}

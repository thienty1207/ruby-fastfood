/**
 * Ruby Kitchen 81 — hero.
 *
 * EDITORIAL SINGLE-COLUMN LAYOUT
 *
 * Reference (the "mâm cơm" teaser): a quiet, stacked, left-aligned column —
 * small caps eyebrow, tight display headline, one quiet line of body, a single
 * pill CTA, then a small illustration row underneath. Type is deliberately
 * smaller than a poster hero: it reads like a menu card, not a billboard.
 *
 *   ┌───────────────────────────────┐
 *   │ EYEBROW                       │
 *   │ BIG FLAVOR.                   │
 *   │ RUBY STYLE.                   │
 *   │ one line of body copy         │
 *   │ [ EXPLORE MENU ]              │
 *   │    (crab)   · illustrated     │
 *   └───────────────────────────────┘
 *
 * The mascot is a companion illustration, not a hero object: it sits at the
 * bottom of the same column, aligned to the text edge, at a small size.
 */
import { gsap, ScrollTrigger } from '../motion/gsap';
import { content } from '../../content/en';

export function rubyHeroMarkup(): string {
  const h = content.hero;

  return `
  <section class="rk-hero" id="top" data-rk-hero>
    <!-- Optional full-bleed photo. Falls back to a designed gradient. -->
    <div class="rk-hero__photo" data-rk-hero-photo aria-hidden="true">
      <img
        src="/img/hero-bg.webp"
        alt=""
        class="rk-hero__photo-img"
        data-rk-photo-img
        loading="eager"
        decoding="async"
        fetchpriority="high"
        draggable="false"
      />
    </div>
    <div class="rk-hero__scrim" aria-hidden="true"></div>

    <div class="rk-hero__inner">
      <p class="rk-hero__eyebrow rk-eyebrow" data-rk-hero-eyebrow>${h.eyebrow}</p>

      <h1 class="rk-hero__title rk-display">
        <span class="rk-hero__line"><span class="rk-hero__line-inner" data-rk-line>${h.headlineTop}</span></span>
        <span class="rk-hero__line rk-hero__line--alt"><span class="rk-hero__line-inner" data-rk-line>${h.headlineBottom}</span></span>
      </h1>

      <p class="rk-hero__lede" data-rk-lede>${h.lede}</p>

      <div class="rk-hero__actions">
        <a class="rk-btn rk-btn--flame" href="${h.cta.href}" data-rk-hero-cta>${h.cta.label}</a>
      </div>

      <!-- Mascot + badge as one small illustration row, aligned to the column -->
      <div class="rk-hero__illu" data-rk-illu>
        <div class="rk-hero__mascot" data-rk-mascot>
          <img
            src="/img-webp/Newlogo-heroSection.webp"
            alt="${h.mascotAlt}"
            width="1254"
            height="1254"
            class="rk-hero__mascot-img"
            data-rk-mascot-img
            draggable="false"
          />
          <span class="rk-hero__mascot-eye rk-hero__mascot-eye--l" data-rk-eye aria-hidden="true"></span>
          <span class="rk-hero__mascot-eye rk-hero__mascot-eye--r" data-rk-eye aria-hidden="true"></span>
        </div>
        <div class="rk-hero__illu-text">
          <span class="rk-hero__badge" data-rk-badge>${h.badges.left}</span>
          <span class="rk-hero__illu-note">${h.illuNote}</span>
        </div>
      </div>
    </div>
  </section>`;
}

/** Returns a cleanup that kills every tween/trigger this hero created. */
export function initRubyHero(): () => void {
  const root = document.querySelector<HTMLElement>('[data-rk-hero]');
  if (!root) return () => {};

  // ── Background photo is optional ────────────────────────────────────
  const photo = root.querySelector<HTMLImageElement>('[data-rk-photo-img]');
  const photoWrap = root.querySelector<HTMLElement>('[data-rk-hero-photo]');
  if (photo && photoWrap) {
    const markMissing = () => {
      photoWrap.classList.add('is-empty');
      photo.remove();
    };
    if (photo.complete && photo.naturalWidth === 0) {
      markMissing();
    } else {
      photo.addEventListener('error', markMissing, { once: true });
      photo.addEventListener('load', () => photoWrap.classList.add('is-loaded'), { once: true });
    }
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = gsap.context(() => {
    if (reduced) {
      gsap.set(
        '[data-rk-line], [data-rk-hero-eyebrow], [data-rk-badge], [data-rk-lede], [data-rk-hero-cta], [data-rk-illu]',
        { opacity: 1, y: 0, clearProps: 'transform' },
      );
      return;
    }

    // ── 1. quiet entrance: type first, illustration last ─────────────
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('[data-rk-hero-eyebrow]', { opacity: 0, y: 10, duration: 0.45 }, 0);
    tl.from(
      '[data-rk-line]',
      { yPercent: 110, opacity: 0, duration: 0.85, stagger: 0.08, ease: 'power4.out' },
      0.08,
    );
    tl.from('[data-rk-lede]', { opacity: 0, y: 12, duration: 0.5 }, 0.45);
    tl.from('[data-rk-hero-cta]', { opacity: 0, y: 12, duration: 0.45 }, 0.55);
    tl.from('[data-rk-illu]', { opacity: 0, y: 16, duration: 0.6 }, 0.7);

    // ── 2. mascot: gentle bob, paused off-screen ─────────────────────
    const bob = gsap.to('[data-rk-mascot]', {
      y: -6,
      duration: 2.6,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 1.4,
    });

    ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? bob.play() : bob.pause()),
    });

    // ── 3. blink, irregular so it reads alive ────────────────────────
    const eyes = root.querySelectorAll<HTMLElement>('[data-rk-eye]');
    let blinkTween: gsap.core.Tween | gsap.core.Tween[] | null = null;
    const blink = () => {
      blinkTween = gsap.to(eyes, {
        scaleY: 0.08,
        duration: 0.07,
        transformOrigin: 'center',
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          blinkTween = gsap.delayedCall(2.8 + Math.random() * 3.4, blink);
        },
      });
    };
    blinkTween = gsap.delayedCall(2.4, blink);

    // ── 4. mascot leans toward the cursor (subtle: max 5deg) ────────
    const mascot = root.querySelector<HTMLElement>('[data-rk-mascot]');
    const setRX = mascot ? gsap.quickSetter(mascot, 'rotate', 'deg') : null;
    const onMove = (e: MouseEvent) => {
      if (!setRX || !mascot) return;
      const r = mascot.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      setRX(Math.max(-5, Math.min(5, (dx / window.innerWidth) * 14)));
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    return () => window.removeEventListener('mousemove', onMove);
  }, root);

  return () => ctx.revert();
}

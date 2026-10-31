/**
 * Ruby Kitchen 81 — hero.
 *
 * "BIG FLAVOR. RUBY STYLE."
 *
 * Deliberately NOT the CRAV hero: no 30vw text-stroke headline, no floating
 * burger, no word-pop. Instead:
 *   - stacked condensed display lines that rise out of a clip mask
 *   - an Anton wordmark that types on with a per-letter lift
 *   - the crab mascot as an animated character (bob + blink + cursor lean)
 *   - a red/black checkerboard band that wipes across on load
 *   - zero dependency on food photography
 *
 * All motion is GSAP, respects prefers-reduced-motion, and every tween is
 * killed by the returned cleanup so resize/HMR cannot duplicate it.
 */
import { gsap, ScrollTrigger } from '../motion/gsap';
import { content } from '../../content/en';

export function rubyHeroMarkup(): string {
  const h = content.hero;

  return `
  <section class="rk-hero" id="top" data-rk-hero>
    <!-- Full-bleed photo behind everything.
         The file is optional: if /img/hero-bg.webp is missing the element
         simply paints the charcoal + gradient fallback, so the page never has
         a broken state while the restaurant supplies photography. -->
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

    <!-- readability scrim over the photo -->
    <div class="rk-hero__scrim" aria-hidden="true"></div>


    <!-- giant ghost word behind everything -->
    <div class="rk-hero__ghost rk-display" aria-hidden="true">${h.ghostWord}</div>

    <div class="rk-hero__inner">
      <p class="rk-hero__eyebrow rk-eyebrow" data-rk-hero-eyebrow>${h.eyebrow}</p>

      <h1 class="rk-hero__title rk-display">
        <span class="rk-hero__line"><span class="rk-hero__line-inner" data-rk-line>${h.headlineTop}</span></span>
        <span class="rk-hero__line rk-hero__line--alt"><span class="rk-hero__line-inner" data-rk-line>${h.headlineBottom}</span></span>
      </h1>

      <!-- rotated sticker badge (right one removed: "ice cold beer" dropped) -->
      <span class="rk-hero__badge rk-hero__badge--l" data-rk-badge>${h.badges.left}</span>

      <!-- animated mascot -->
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

      <div class="rk-hero__actions">
        <a class="rk-btn rk-btn--flame" href="${h.cta.href}" data-rk-hero-cta>${h.cta.label}</a>
      </div>

      <div class="rk-hero__facts">
        <p class="rk-body" data-rk-fact>${h.paraLeft}</p>
        <p class="rk-body rk-hero__fact-right" data-rk-fact>${h.paraRight}</p>
      </div>
    </div>

    <div class="rk-hero__scroll" aria-hidden="true">
      <span class="rk-hero__scroll-label">${content.a11y.scrollHint}</span>
      <span class="rk-hero__scroll-rail"><span class="rk-hero__scroll-dot"></span></span>
    </div>
  </section>`;
}

/** Returns a cleanup that kills every tween/trigger this hero created. */
export function initRubyHero(): () => void {
  const root = document.querySelector<HTMLElement>('[data-rk-hero]');
  if (!root) return () => {};

  // ── Background photo is optional ────────────────────────────────────
  // If /img/hero-bg.webp has not been supplied yet, hide the <img> so the
  // browser never paints a broken-image icon; the CSS gradient on
  // .rk-hero__photo is the designed fallback, not a placeholder.
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
      photo.addEventListener(
        'load',
        () => photoWrap.classList.add('is-loaded'),
        { once: true },
      );
    }
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = gsap.context(() => {
    if (reduced) {
      // static, fully legible state — no motion at all
      gsap.set('[data-rk-line], [data-rk-hero-eyebrow], [data-rk-badge], [data-rk-fact], [data-rk-hero-cta], [data-rk-mascot]', {
        opacity: 1,
        y: 0,
        clearProps: 'transform',
      });
      return;
    }

    // ── 1. entrance timeline ─────────────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });


    // eyebrow
    tl.from('[data-rk-hero-eyebrow]', { opacity: 0, y: 14, duration: 0.5 }, 0.15);

    // headline lines rise out of their mask
    tl.from(
      '[data-rk-line]',
      { yPercent: 115, opacity: 0, duration: 1.05, stagger: 0.11, ease: 'power4.out' },
      0.2,
    );

    // mascot lands
    tl.from(
      '[data-rk-mascot]',
      { scale: 0.55, opacity: 0, y: 60, rotate: -8, duration: 1.1, ease: 'back.out(1.8)' },
      0.55,
    );

    // badges snap in
    tl.from('[data-rk-badge]', { opacity: 0, scale: 0.7, rotate: -12, duration: 0.55, stagger: 0.12, ease: 'back.out(2.4)' }, 0.85);

    // copy + cta
    tl.from('[data-rk-fact]', { opacity: 0, y: 18, duration: 0.6, stagger: 0.1 }, 0.95);
    tl.from('[data-rk-hero-cta]', { opacity: 0, y: 16, duration: 0.5 }, 1.0);

    // ── 2. idle mascot bob (paused when off-screen) ───────────────────
    const bob = gsap.to('[data-rk-mascot]', {
      y: -14,
      duration: 2.4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 1.8,
    });

    ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? bob.play() : bob.pause()),
    });

    // ── 3. blink loop (irregular, so it reads alive) ──────────────────
    const eyes = root.querySelectorAll<HTMLElement>('[data-rk-eye]');
    let blinkTween: gsap.core.Tween | null = null;
    const blink = () => {
      blinkTween = gsap.to(eyes, {
        scaleY: 0.08,
        duration: 0.07,
        transformOrigin: 'center',
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          const next = 2.6 + Math.random() * 3.6;
          blinkTween = gsap.delayedCall(next, blink);
        },
      });
    };
    blinkTween = gsap.delayedCall(2.2, blink);

    // ── 4. mascot leans toward the cursor ─────────────────────────────
    const mascot = root.querySelector<HTMLElement>('[data-rk-mascot]');
    const setRX = mascot ? gsap.quickSetter(mascot, 'rotate', 'deg') : null;
    const onMove = (e: MouseEvent) => {
      if (!setRX || !mascot) return;
      const r = mascot.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const dx = e.clientX - cx;
      const max = 8;
      setRX(Math.max(-max, Math.min(max, (dx / window.innerWidth) * 22)));
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // ── 5. parallax on scroll: ghost word drifts, title scales away ───
    gsap.to('[data-rk-hero] .rk-hero__ghost', {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 1 },
    });
    gsap.to('.rk-hero__title', {
      yPercent: -14,
      opacity: 0.25,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 1 },
    });

    return () => {
      window.removeEventListener('mousemove', onMove);
      blinkTween?.kill();
    };
  }, root);

  return () => ctx.revert();
}

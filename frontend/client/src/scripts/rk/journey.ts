/**
 * Ruby Kitchen 81 — the travelling section ("journey").
 *
 * MECHANISM COPIED 1:1 from the clone's #map-desktop:
 *   - same dashed route path (ROUTE_D), same 1728x2176 viewBox
 *   - same shared ScrollTrigger { start:'-10% top', end:'75%', scrub:1 }
 *   - same MotionPath + autoRotate:-90 travel
 *   - same pin thresholds [0.14, 0.28, 0.5, 0.68, 0.91] with the identical
 *     fromTo/to pop-in and back.out(2.2) / back.in(1.2) eases
 *   - same inertial shove on pins and labels (velocity/rotation/resistance)
 *   - same 163vw section height and vw-based pin coordinates
 *
 * ONLY two things differ, as requested: the aeroplane is the RUBY CRAB, and the
 * background is black instead of mustard.
 *
 * Pin artwork uses Ruby's own product photography. The clone's pins were photos
 * of people eating CRAV burgers in Berlin/London/NY/Sydney/Tokyo, which cannot
 * be reused — so the same five slots now show Ruby's dishes and the diner.
 */
import { gsap, ScrollTrigger } from '../motion/gsap';
import { revealLines } from '../motion/linesReveal';
import { content } from '../../content/en';

const { journey } = content;

/** Identical to the clone's route, unchanged. */
const ROUTE_D =
  'M500 -139C557 -139 1550.43 364.378 1610.6 653.93C1745.6 1303.59 -160.566 551.165 -11.7069 1197.36C117.259 1757.21 1470.1 925.826 1474.12 1502.33C1478.15 2080.14 63.7084 1375.34 -11.707 1896.78C-107.419 2558.55 1928.5 2042.5 1928.5 2042.5';

export function journeyMarkup(): string {
  const pins = journey.pins
    .map(
      (p, i) => `
      <div class="rk-jr__pin rk-jr__pin--${i}" data-rk-jr-pin="${i}" style="cursor:pointer;will-change:transform">
        <p class="rk-jr__label rk-jr__label--${i}" data-rk-jr-label="${i}" style="will-change:transform;cursor:pointer">${p.label}</p>
        <div class="rk-jr__thumb">
          <img src="${p.img}" alt="${p.alt}" width="1000" height="1000" class="rk-jr__img"${
            p.focus ? ` style="object-position:${p.focus}"` : ''
          } draggable="false" loading="lazy" decoding="async">
        </div>
      </div>`,
    )
    .join('');

  return `
  <section class="rk-jr" id="${journey.id}" data-rk-jr>
    <!-- THE CRAB replaces the aeroplane; same wrapper, same transform setup -->
    <div class="rk-jr__crab" data-rk-jr-crab aria-hidden="true">
      <img src="/img-webp/Newlogo-heroSection.webp" alt="" width="1254" height="1254" class="rk-jr__crab-img" draggable="false">
    </div>

    <div class="rk-jr__inner" data-rk-jr-inner>
      <div class="rk-jr__route-wrap" aria-hidden="true">
        <svg class="rk-jr__route" width="1728" height="2176" viewBox="0 0 1728 2176" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path data-rk-jr-route d="${ROUTE_D}" stroke="var(--rk-gold)" stroke-opacity="0.5" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="42 42"></path>
        </svg>
      </div>

      <div class="rk-jr__copy">
        <p class="rk-eyebrow rk-jr__eyebrow">${journey.eyebrow}</p>
        <h2 class="rk-jr__title rk-display">
          <span>${journey.headlineTop}</span>
          <span class="rk-jr__title-alt">${journey.headlineBottom}</span>
        </h2>
        <p class="rk-jr__sub" data-lines data-delay=".25">${journey.sub}</p>
      </div>

      ${pins}
    </div>
  </section>`;
}

export function initJourney(): () => void {
  const section = document.querySelector<HTMLElement>('[data-rk-jr]');
  if (!section) return () => {};

  const inner = section.querySelector<HTMLElement>('[data-rk-jr-inner]');
  const route = section.querySelector<SVGPathElement>('[data-rk-jr-route]');
  const crab = section.querySelector<HTMLElement>('[data-rk-jr-crab]');
  const pins = [...section.querySelectorAll<HTMLElement>('[data-rk-jr-pin]')];
  const labels = [...section.querySelectorAll<HTMLElement>('[data-rk-jr-label]')];
  if (!inner) return () => {};

  const cleanups: Array<() => void> = [];

  // Line reveal on the paragraph (same utility the clone uses).
  section.querySelectorAll<HTMLElement>('[data-lines]').forEach((el) => {
    const dispose = revealLines(el, { start: 'top 95%', delay: 0.25 });
    if (typeof dispose === 'function') cleanups.push(dispose as () => void);
  });

  const mm = gsap.matchMedia();

  /* ══════════════════════════════════════════════════════════════════
     DESKTOP + motion allowed: the full 1:1 mechanism
     ══════════════════════════════════════════════════════════════════ */
  // Runs on EVERY viewport with motion allowed — the crab must travel on mobile
  // too. Only prefers-reduced-motion opts out.
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // ---------- inertial shove on pins and labels (unchanged) ----------
    const listeners: Array<() => void> = [];
    const attachInertia = (el: HTMLElement, vel: number, rotVel: number, resistance: number) => {
      let lastX = 0;
      let lastY = 0;
      let dx = 0;
      let dy = 0;
      const baseRotation = parseFloat(gsap.getProperty(el, 'rotation') as string) || 0;

      const onMove = (e: MouseEvent) => {
        dx = e.clientX - lastX;
        dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
      };
      const onEnter = (e: MouseEvent) => {
        dx = 0;
        dy = 0;
        lastX = e.clientX;
        lastY = e.clientY;
      };
      const onLeave = () => {
        gsap.to(el, {
          inertia: {
            x: { velocity: vel * dx, end: 0 },
            y: { velocity: vel * dy, end: 0 },
            rotation: { velocity: rotVel * dx, end: baseRotation },
            resistance,
          },
          force3D: true,
        });
      };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
      listeners.push(() => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
    pins.forEach((p) => attachInertia(p, 30, 2, 140));
    labels.forEach((l) => attachInertia(l, 25, 1.5, 170));

    const shared = {
      trigger: inner,
      start: '-10% top',
      end: '75%',
      scrub: 1,
      invalidateOnRefresh: true,
    };

    // ---------- pins pop in by scroll progress (unchanged thresholds) -----
    const thresholds = [0.14, 0.28, 0.5, 0.68, 0.91];
    pins.forEach((p) => gsap.set(p, { opacity: 0, scale: 0.8, rotate: 0 }));
    const shown = new Array(pins.length).fill(false);

    const pinTrigger = ScrollTrigger.create({
      ...shared,
      onUpdate: (self) => {
        const t = self.progress;
        thresholds.forEach((th, i) => {
          const el = pins[i];
          if (!el) return;
          if (t >= th && !shown[i]) {
            gsap.fromTo(
              el,
              { opacity: 0, scale: 0.8, rotate: -15 + 30 * Math.random() },
              {
                opacity: 1,
                scale: 1.08,
                rotate: 5 - 10 * Math.random(),
                duration: 0.45,
                ease: 'back.out(2.2)',
                overwrite: 'auto',
                force3D: true,
              },
            );
            shown[i] = true;
          } else if (t < th && shown[i]) {
            gsap.to(el, {
              opacity: 0,
              scale: 0.8,
              rotate: -15 + 30 * Math.random(),
              duration: 0.28,
              ease: 'back.in(1.2)',
              overwrite: 'auto',
              force3D: true,
            });
            shown[i] = false;
          }
        });
      },
    });

    // ---------- the crab follows the dashed route (was: the plane) -------
    let crabTween: gsap.core.Tween | undefined;
    let crabOpacity: ScrollTrigger | undefined;
    let crabLean: ScrollTrigger | undefined;
    if (crab && route) {
      gsap.set(crab, { xPercent: -50, yPercent: -50 });
      // autoRotate:-90 is what the plane used so its nose points along the path.
      // The crab is drawn upright with eyes and claws; on the return legs of the
      // route that rotation flips it upside down (verified in a capture).
      // So: follow the path with autoRotate:false and drive rotation separately
      // from the travel direction, clamped to a range where the crab still
      // reads upright.
      crabTween = gsap.to(crab, {
        motionPath: { path: route, align: route, alignOrigin: [0.5, 0.5], autoRotate: false },
        ease: 'none',
        force3D: true,
        scrollTrigger: { ...shared },
      });

      // Rotation: sample the crab's horizontal velocity each tick and lean into
      // it. Clamped to +/-42deg and eased, so it never spins or inverts.
      let prevX: number | null = null;
      const lean = gsap.quickTo(crab, 'rotation', { duration: 0.35, ease: 'power2.out' });
      crabLean = ScrollTrigger.create({
        trigger: inner,
        start: '-10% top',
        end: '75%',
        scrub: true,
        onUpdate: () => {
          const x = crab.getBoundingClientRect().left + crab.offsetWidth / 2;
          if (prevX !== null) {
            const dx = x - prevX;
            const target = gsap.utils.clamp(-42, 42, dx * 0.55);
            lean(target);
          }
          prevX = x;
        },
      });
      // The route genuinely runs off the left edge (the clone's plane does too —
      // verified in the reference capture). The plane is a side-on silhouette so
      // clipping reads as "flying past"; the crab is a round shape with eyes, so
      // a hard cut looks broken. Fading it while it is outside the viewport makes
      // the exit intentional instead of accidental.
      crabOpacity = ScrollTrigger.create({
        trigger: inner,
        start: "-10% top",
        end: "75%",
        // Opacity follows the crab HORIZONTAL position, not scroll progress:
        // the crab is only outside the viewport for part of the travel.
        onUpdate: () => {
          const rect = crab.getBoundingClientRect();
          const w = crab.offsetWidth || 1;
          const t = gsap.utils.clamp(0, 1, (rect.left + w * 0.85) / (w * 0.6));
          crab.style.opacity = String(t);
        },
      });
    }

    // Clone does a delayed refresh; fonts/images change the route box.
    const t = setTimeout(() => ScrollTrigger.refresh(), 1000);

    return () => {
      clearTimeout(t);
      listeners.forEach((fn) => fn());
      pinTrigger.kill();
      crabTween?.scrollTrigger?.kill();
      crabTween?.kill();
      crabLean?.kill();
      crabOpacity?.kill();
      if (crab) crab.style.opacity = '';
      gsap.set(pins, { clearProps: 'opacity,transform,scale,rotate' });
    };
  });

  /* ══════════════════════════════════════════════════════════════════
     MOBILE / reduced motion: everything visible, no motionPath
     ══════════════════════════════════════════════════════════════════ */
  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set(pins, { opacity: 1, scale: 1, rotate: 0, clearProps: 'transform' });
    return () => {
      gsap.set(pins, { clearProps: 'opacity,transform,scale,rotate' });
    };
  });

  cleanups.push(() => mm.revert());

  return () => cleanups.forEach((fn) => fn());
}

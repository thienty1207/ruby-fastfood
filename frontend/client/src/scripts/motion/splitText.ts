// Text "pop" reveal — faithful port of the original's custom splitter
// (chunk 0dvuw12hbr-ev.js, module 59598).
//
// Behaviour (CONFIRMED from source):
//   set: {opacity:0, scale:0, y:0, rotation:0, transformOrigin:"50% 90%", force3D:true}
//   fromTo y: random(18,40), rotation: random(-16,16)
//   to:   {opacity:1, scale:1, y:0, delay, rotation:0, duration:.72,
//          ease:"back.out(2.35)", stagger:.055}
//   trigger: ScrollTrigger {start:"top 88%", once:true}
//   reduced motion: plain opacity fade, .4s power1.out, stagger .02
import { gsap, ScrollTrigger } from './gsap';

type SplitKind = 'words' | 'chars';

export interface SplitTextOptions {
  delay?: number;
  duration?: number;
  ease?: string;
  stagger?: number;
  scroll?: boolean;
  scrollStart?: string;
  once?: boolean;
  split?: SplitKind;
  /** Tag of the wrapper, defaults to span */
  as?: string;
  className?: string;
}

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Split a string into renderable chunks, preserving explicit newlines as <br>. */
function tokenize(text: string, kind: SplitKind): string[] {
  if (kind === 'chars') return [...text];
  return text.split(/(\s+)/).filter((s) => s.length > 0);
}

/** Build the inner markup: sr-only copy + aria-hidden animated copy. */
export function buildSplitMarkup(text: string, kind: SplitKind = 'words'): string {
  const parts = tokenize(text, kind)
    .map((p) => {
      if (p === '\n') return '<br>';
      if (/^\s+$/.test(p)) return `<span>${p}</span>`;
      return `<span data-pop class="inline-block will-change-transform">${escapeHtml(p)}</span>`;
    })
    .join('');
  return `<span class="sr-only">${escapeHtml(text)}</span><span aria-hidden="true" data-split-inner>${parts}</span>`;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Animate every [data-pop] inside `root`. Call after the markup is in the DOM. */
export function revealSplit(root: Element, opts: SplitTextOptions = {}): void {
  const {
    delay = 0,
    duration = 0.72,
    ease = 'back.out(2.35)',
    stagger = 0.055,
    scroll = true,
    scrollStart = 'top 88%',
    once = true,
  } = opts;

  const targets = root.querySelectorAll('[data-pop]');
  if (!targets.length) return;

  const play = () => {
    const inner = root.querySelector<HTMLElement>('[data-split-inner]');
    if (inner) inner.style.visibility = 'visible';

    if (reduceMotion()) {
      gsap.fromTo(
        targets,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, delay, ease: 'power1.out', stagger: 0.02, overwrite: 'auto' },
      );
      return;
    }

    gsap.set(targets, {
      opacity: 0,
      scale: 0,
      y: 0,
      rotation: 0,
      transformOrigin: '50% 90%',
      force3D: true,
    });

    gsap.fromTo(
      targets,
      {
        opacity: 0,
        scale: 0,
        y: () => gsap.utils.random(18, 40),
        rotation: () => gsap.utils.random(-16, 16),
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        delay,
        rotation: 0,
        duration,
        ease,
        stagger,
        overwrite: 'auto',
      },
    );
  };

  if (scroll) {
    ScrollTrigger.create({ trigger: root, start: scrollStart, once, onEnter: play });
  } else {
    play();
  }

  // Keep triggers honest after fonts land / resize (original does the same).
  const refresh = () => {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  window.addEventListener('resize', refresh);
}
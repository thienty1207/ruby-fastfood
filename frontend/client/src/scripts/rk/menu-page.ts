/**
 * /menu page controller.
 *
 * One active index drives three surfaces: the main image, the counter/title and
 * the thumbnail rail. Keyboard: ← → to change page, Esc to close the lightbox.
 * The lightbox is a real dialog: focus moves into it, the page behind does not
 * scroll, and Esc/backdrop close it.
 */
import { content } from '../../content/en';

const pages = content.fullMenu.pages;

export function initMenuPage(): () => void {
  const root = document.querySelector<HTMLElement>('[data-rkm]');
  if (!root) return () => {};

  const img = root.querySelector<HTMLImageElement>('[data-rkm-img]');
  const count = root.querySelector<HTMLElement>('[data-rkm-count]');
  const title = root.querySelector<HTMLElement>('[data-rkm-title]');
  const prev = root.querySelector<HTMLButtonElement>('[data-rkm-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-rkm-next]');
  const stage = root.querySelector<HTMLElement>('[data-rkm-stage]');
  const thumbs = [...root.querySelectorAll<HTMLButtonElement>('[data-rkm-thumb]')];

  const lb = root.querySelector<HTMLElement>('[data-rkm-lb]');
  const lbImg = root.querySelector<HTMLImageElement>('[data-rkm-lb-img]');
  const lbLabel = root.querySelector<HTMLElement>('[data-rkm-lb-label]');
  const lbClose = root.querySelector<HTMLButtonElement>('[data-rkm-lb-close]');
  const lbPrev = root.querySelector<HTMLButtonElement>('[data-rkm-lb-prev]');
  const lbNext = root.querySelector<HTMLButtonElement>('[data-rkm-lb-next]');

  if (!img || !lb || !lbImg) return () => {};

  let index = 0;
  let lastFocus: HTMLElement | null = null;

  const pad = (n: number) => String(n).padStart(2, '0');

  /** Paint every surface from the current index. */
  const render = () => {
    const p = pages[index];
    if (!p) return;

    img.src = p.src;
    img.alt = p.alt;

    if (count) count.textContent = `${pad(index + 1)} / ${pad(pages.length)}`;
    if (title) title.textContent = p.title;

    thumbs.forEach((t, i) => t.setAttribute('aria-current', i === index ? 'true' : 'false'));

    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === pages.length - 1;

    // Lightbox mirrors the active page.
    lbImg.src = p.src;
    lbImg.alt = p.alt;
    if (lbLabel) lbLabel.textContent = `${p.n} · ${p.title}`;
    if (lbPrev) lbPrev.disabled = index === 0;
    if (lbNext) lbNext.disabled = index === pages.length - 1;

    // Keep the active thumbnail in view on narrow screens.
    thumbs[index]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  };

  const go = (delta: number) => {
    const nextIndex = Math.max(0, Math.min(pages.length - 1, index + delta));
    if (nextIndex === index) return;
    index = nextIndex;
    render();
  };

  /* ── Lightbox open/close ───────────────────────────────────────────── */
  const openLb = () => {
    lastFocus = document.activeElement as HTMLElement | null;
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    lbClose?.focus();
  };

  const closeLb = () => {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    lastFocus?.focus();
  };

  const isOpen = () => lb.classList.contains('is-open');

  /* ── Wiring ────────────────────────────────────────────────────────── */
  const onPrev = () => go(-1);
  const onNext = () => go(1);
  const onThumb = (e: Event) => {
    const el = (e.currentTarget as HTMLElement).dataset.rkmThumb;
    if (el == null) return;
    index = Number(el);
    render();
  };
  const onStageKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLb();
    }
  };
  const onLbBackdrop = (e: MouseEvent) => {
    // Only a click on the backdrop itself closes; clicks on the image must not.
    if (e.target === lb || (e.target as HTMLElement).classList.contains('rkm-lb__stage')) closeLb();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen()) {
      closeLb();
      return;
    }
    if (e.key === 'ArrowLeft') {
      go(-1);
    } else if (e.key === 'ArrowRight') {
      go(1);
    }
  };

  prev?.addEventListener('click', onPrev);
  next?.addEventListener('click', onNext);
  thumbs.forEach((t) => t.addEventListener('click', onThumb));
  stage?.addEventListener('click', openLb);
  stage?.addEventListener('keydown', onStageKey);
  lbClose?.addEventListener('click', closeLb);
  lbPrev?.addEventListener('click', onPrev);
  lbNext?.addEventListener('click', onNext);
  lb.addEventListener('click', onLbBackdrop);
  document.addEventListener('keydown', onKey);

  render();

  return () => {
    prev?.removeEventListener('click', onPrev);
    next?.removeEventListener('click', onNext);
    thumbs.forEach((t) => t.removeEventListener('click', onThumb));
    stage?.removeEventListener('click', openLb);
    stage?.removeEventListener('keydown', onStageKey);
    lbClose?.removeEventListener('click', closeLb);
    lbPrev?.removeEventListener('click', onPrev);
    lbNext?.removeEventListener('click', onNext);
    lb.removeEventListener('click', onLbBackdrop);
    document.removeEventListener('keydown', onKey);
    document.documentElement.style.overflow = '';
  };
}

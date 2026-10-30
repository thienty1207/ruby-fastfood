// Line-mask text reveal — matches the original's TextReveal exactly.
//
// CONFIRMED from the original's live DOM, the reveal wraps the element's own
// TEXT in <span class="inline-block"> only when the element has no element
// children. When the element already contains element children (the footer's
// two desktop/mobile <span>s), SplitText masks THOSE spans in place:
//
//   footer case   <p>  <span class="md:hidden block"> <div class="line-mask">…
//   hero para     <p>  <span class="inline-block">    <div class="line-mask">…
//
// Wrapping the footer case again in an extra inline-block span adds a stray
// line box (39px at 1440) — that was the only remaining height delta.
import { gsap, ScrollTrigger, SplitText } from './gsap';

const reduceMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function revealLines(
  el: HTMLElement,
  opts: { start?: string; delay?: number; once?: boolean } = {},
): void {
  const { start = 'top 90%', delay = 0, once = true } = opts;
  if (el.dataset.linesDone === '1') return;
  el.dataset.linesDone = '1';
  if (reduceMotion()) return;

  // Already has element children → mask EACH child span in place. The original
  // does this for the footer's responsive pair (`hidden max-md:block` +
  // `md:hidden block`), which needs both branches masked, not just the first.
  const childSpans = [...el.children].filter(
    (c): c is HTMLElement => c instanceof HTMLElement && c.tagName === 'SPAN',
  );

  const hosts: HTMLElement[] = [];
  if (childSpans.length) {
    hosts.push(...childSpans);
  } else {
    const text = (el.textContent ?? '').trim();
    const wrapper = document.createElement('span');
    wrapper.className = 'inline-block';
    wrapper.setAttribute('aria-label', text);
    wrapper.innerHTML = el.innerHTML;
    el.innerHTML = '';
    el.appendChild(wrapper);
    hosts.push(wrapper);
  }

  const lines: HTMLElement[] = [];
  for (const host of hosts) {
    const split = new SplitText(host, {
      type: 'lines',
      linesClass: 'line',
      mask: 'lines',
    });
    lines.push(...(split.lines as HTMLElement[]));
  }
  if (!lines.length) return;

  gsap.set(lines, { yPercent: 110 });
  gsap.to(lines, {
    yPercent: 0,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.08,
    delay,
    scrollTrigger: { trigger: el, start, once },
  });
}
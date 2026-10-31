/**
 * Ruby Kitchen 81 — footer (the only remaining below-hero block).
 *
 * The menu / burgers / chicken / combos / visit sections were removed per
 * client direction. Address, phone and the Maps link moved into the footer, so
 * the nav's "Visit"/"Contact" anchors still land on real content and nothing
 * links to a section that no longer exists.
 */
import { gsap } from '../motion/gsap';
import { content } from '../../content/en';

const { brand, contact, footer } = content;

export function footerMarkup(): string {
  return `
  <footer class="rk-foot" id="visit" data-rk-foot>
    <div class="rk-visit-strip" id="contact">
      <div class="rk-wrap">
        <div class="rk-visit-strip__inner">
          <div class="rk-visit-strip__col">
            <p class="rk-eyebrow">${content.visit.eyebrow}</p>
            <h2 class="rk-visit-strip__title rk-display">${content.visit.headline}</h2>
          </div>

          <dl class="rk-visit-strip__facts">
            <div class="rk-fact">
              <dt>${content.visit.labels.address}</dt>
              <dd>${contact.address}</dd>
            </div>
            <div class="rk-fact">
              <dt>${content.visit.labels.phone}</dt>
              <dd><a href="${contact.phoneHref}">${contact.phone}</a></dd>
            </div>
          </dl>

          <div class="rk-visit-strip__cta">
            <a class="rk-btn rk-btn--flame" href="${contact.mapUrl}" target="_blank" rel="noopener noreferrer">
              ${content.visit.labels.map}
            </a>
            <a class="rk-btn rk-btn--ghost" href="${contact.phoneHref}">${content.visit.labels.call}</a>
          </div>
        </div>

      </div>
    </div>

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

/** Footer only: the visit strip band draws in, the wordmark rises. */
export function initRubySections(): () => void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = gsap.context(() => {
    if (reduced) return;


    gsap.from('.rk-foot__mark', {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: '[data-rk-foot]', start: 'top 92%', once: true },
    });

    gsap.utils.toArray<HTMLElement>('.rk-visit-strip__facts .rk-fact').forEach((el, i) => {
      gsap.from(el, {
        opacity: 0,
        y: 18,
        duration: 0.5,
        delay: i * 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 95%', once: true },
      });
    });
  });

  return () => ctx.revert();
}

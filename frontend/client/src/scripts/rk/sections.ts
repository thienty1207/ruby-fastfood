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
  ${/* The find-us strip was removed on request; its content already lives in the
       footer columns below (address, phone, email, socials). The two anchors the
       navbar points at are kept so #visit and #contact still resolve. */ ''}
  <footer class="rk-foot" data-rk-foot>
    <span id="visit" class="rk-anchor" aria-hidden="true"></span>
    <span id="contact" class="rk-anchor" aria-hidden="true"></span>

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
            <li><a href="mailto:${contact.email}">${contact.email}</a></li>
          </ul>
        </div>
        <div>
          <h3>Follow</h3>
          <ul>
            ${contact.socials
              .map(
                (s) =>
                  `<li><a href="${s.href}" target="_blank" rel="noopener noreferrer">${s.label}</a></li>`,
              )
              .join('')}
          </ul>
        </div>
      </div>
      <p class="rk-foot__rights">${footer.rights}</p>
    </div>
  </footer>`;
}

/** Footer only: the wordmark rises on entry. */
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
  });

  return () => ctx.revert();
}

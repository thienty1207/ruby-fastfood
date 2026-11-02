/**
 * Ruby Kitchen 81 — footer (the only remaining below-hero block).
 *
 * The menu / burgers / chicken / combos / visit sections were removed per
 * client direction. Contact details stay in the footer; the Visit navigation
 * link opens the supplied Google Maps location.
 */
import { content } from '../../content/en';

const { contact, footer } = content;

export function footerMarkup(): string {
  return `
  ${/* Contact details live in the footer; keep the contact anchor for navigation. */ ''}
  <footer class="rk-foot" data-rk-foot>
    <span id="contact" class="rk-anchor" aria-hidden="true"></span>

    <div class="rk-wrap">
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

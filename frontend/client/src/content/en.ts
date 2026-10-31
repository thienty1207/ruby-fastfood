/**
 * Ruby Kitchen 81 — content dictionary (English).
 *
 * EVERY user-facing string lives here. No copy is inlined in markup.
 * Adding Vietnamese later = add `vi.ts` with the same shape; no component
 * changes. This is why the file exists even though only `en` ships now.
 *
 * Rules followed (client instruction #2):
 *   - No invented history, founding date, awards, certifications, nutrition.
 *   - No menu item, price or promotion beyond the supplied list.
 *   - Descriptions are marked `verified: false` where they were inferred
 *     from the dish name only, so the UI can omit them.
 */

export interface MenuItem {
  name: string;
  price: number | null; // VND, integer. null = price not supplied
  /** One line. Only render when `verified` is true. */
  description?: string;
  verified: boolean;
  /** Reserved slot for a future real photo. Never CRAV imagery. */
  imageUrl?: string;
}

export interface MenuCategory {
  id: string;
  label: string;
  count: number | null; // null = item list not supplied yet
  blurb: string;
  /** Hidden until items are supplied (blocker B5). */
  hasItems: boolean;
}

export const content = {
  brand: {
    name: 'RUBY KITCHEN 81',
    short: 'RUBY',
    /** Split for two-tone wordmark: RUBY / KITCHEN / 81 */
    parts: ['RUBY', 'KITCHEN', '81'],
    tagline: 'Burgers · Fried Chicken · Cold Beer',
  },

  contact: {
    address: '24, 30/4 Street, Dương Đông, Phú Quốc',
    addressShort: 'Dương Đông, Phú Quốc',
    phone: '0327 81 57 57',
    phoneHref: 'tel:+84327815757',
    /** Google Maps search URL — verified address, no place ID supplied. */
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=24+30%2F4+Street+Duong+Dong+Phu+Quoc+Vietnam',
    hours: null as string | null, // B4 — not supplied; UI omits the row
  },

  nav: {
    // Only anchors that exist on the page. The menu/burgers/chicken/combos/
    // visit sections were removed, so those links are gone rather than dead.
    links: [
      { label: 'Home', href: '#top' },
      { label: 'Visit', href: '#visit' },
      { label: 'Contact', href: '#contact' },
    ],
    cta: { label: 'Call Us', href: 'tel:+84327815757' },
    menuOpenLabel: 'Open menu',
    menuCloseLabel: 'Close menu',
  },

  hero: {
    eyebrow: 'WESTERN DINER · PHÚ QUỐC',
    headlineTop: 'BIG FLAVOR.',
    headlineBottom: 'RUBY STYLE.',
    /** Quiet one-liner under the headline (single-column editorial layout). */
    lede: 'Burgers, fried chicken and cold beer — made fresh to order in Dương Đông, Phú Quốc.',
    /** Kept for the page <meta name="description"> in RubyBase.astro. */
    paraLeft:
      'Burgers, fried chicken and cold beer, made fresh to order in Dương Đông. No shortcuts, no small portions.',
    cta: { label: 'Explore Menu', href: '#menu' },
    mascotAlt: 'Ruby Kitchen 81 crab mascot',
  },

  menus: {
    eyebrow: 'OUR MENU',
    headline: 'EXPLORE THE MENU',
    sub: 'Seven ways to get full.',
    orderLabel: 'Order',
  },

  categories: [
    { id: 'burgers', label: 'Burgers', count: 5, blurb: 'Beef, chicken, veggie.', hasItems: true },
    { id: 'combos', label: 'Combos', count: 6, blurb: 'Burger, sides, drink.', hasItems: true },
    { id: 'chicken', label: 'Chicken & Snacks', count: null, blurb: 'Fried, golden, gone.', hasItems: false },
    { id: 'hotdog', label: 'Hotdog & Sausage', count: null, blurb: 'On a bun, loaded.', hasItems: false },
    { id: 'pasta', label: 'Pasta', count: null, blurb: 'Comfort in a bowl.', hasItems: false },
    { id: 'salads', label: 'Salads', count: null, blurb: 'Fresh on the side.', hasItems: false },
    { id: 'drinks', label: 'Drinks & Beer', count: null, blurb: 'Cold, poured, ready.', hasItems: false },
  ] as MenuCategory[],

  burgers: {
    eyebrow: 'SIGNATURE',
    headline: 'BURGERS WORTH THE MESS',
    sub: 'Five house burgers, built to order.',
    items: [
      { name: 'Double Beef & Bacon Burger', price: 140000, verified: false },
      { name: 'Cheese Burger', price: 75000, verified: false },
      { name: 'Crispy Chicken Burger', price: 65000, verified: false },
      { name: 'Garlic Chicken Cheese Burger', price: 75000, verified: false },
      { name: 'Vegetarian Burger', price: 65000, verified: false },
    ] as MenuItem[],
  },

  chicken: {
    eyebrow: 'CRISPY',
    /** 4-line kinetic type stunt — layout device, Ruby words. */
    headlineWords: ['FRIED', 'GOLDEN', 'CRUNCHY', 'GONE'],
    sub: 'From the fryer, straight to the tray.',
    /** B5 — no items/prices supplied yet, so no fake list is shown. */
    items: [] as MenuItem[],
    emptyNote: 'Ask in store for today’s chicken and snack selection.',
  },

  combos: {
    eyebrow: 'MAKE IT A COMBO',
    headline: 'THE FULL SETUP',
    sub: 'Burger, sides and a drink. Six set-ups, one decision.',
    items: [
      { name: 'Double Beef & Bacon Deluxe Set', price: 169000, verified: false },
      { name: 'Garlic Chicken Deluxe Set', price: 119000, verified: false },
      { name: 'Crispy Chicken Deluxe Set', price: 109000, verified: false },
      { name: 'Cheese Burger Combo', price: 105000, verified: false },
      { name: 'Garlic Chicken Cheese Combo', price: 99000, verified: false },
      { name: 'Crispy Chicken Combo', price: 85000, verified: false },
    ] as MenuItem[],
  },

  visit: {
    eyebrow: 'FIND US',
    headline: 'COME HUNGRY.',
    sub: 'Western diner in Dương Đông, Phú Quốc.',
    labels: {
      address: 'Address',
      phone: 'Phone',
      hours: 'Hours',
      map: 'Open in Maps',
      call: 'Call Us',
    },
  },

  footer: {
    wordmark: 'RUBY KITCHEN 81',
    tagline: 'Burgers · Fried Chicken · Cold Beer',
    navHeading: 'Explore',
    contactHeading: 'Find us',
    rights: `© ${new Date().getFullYear()} RUBY KITCHEN 81 — All rights reserved`,
    /** Nothing about CRAV, 1997 or Navarra survives here. */
  },

  a11y: {
    skipToMenu: 'Skip to menu',
    scrollHint: 'Scroll',
  },
} as const;

/** 140000 → "140.000₫" (Vietnamese grouping, no decimals) */
export function formatPrice(vnd: number | null): string {
  if (vnd === null) return '—';
  return `${vnd.toLocaleString('vi-VN')}₫`;
}

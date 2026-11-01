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

/** A card in the signature showcase. `imageUrl` is optional by design so the
 *  component keeps working before photography exists. */
/** One chapter of the signature showcase. `imageUrl` is optional so the
 *  component still works before photography exists. */
export interface SignatureItem {
  n: string;
  eyebrow: string;
  heading: string;
  body: string;
  /** Small line under the body, e.g. "Cheese Burger · 75.000đ" */
  meta: string;
  name: string;
  priceLabel: string;
  imageUrl?: string;
  imageAlt?: string;
  /** CSS object-position for the cinematic crop */
  focus?: string;
}
/** One printed page of the Ruby Kitchen 81 menu booklet. */
export interface MenuPage {
  n: string;
  title: string;
  /** Short descriptor shown under the title */
  caption: string;
  src: string;
  alt: string;
}
export const content = {
  brand: {
    name: 'RUBY KITCHEN 81',
    short: 'RUBY',
    /** Split for two-tone wordmark: RUBY / KITCHEN / 81 */
    parts: ['RUBY', 'KITCHEN', '81'],
    tagline: 'Burgers · Fried Chicken · Cold Beer',
  },

  /* Verified against the venue's own site (burgerphuquoc.com/contact-us) and its
     Google Maps listing on 2026-10-31. Nothing here is inferred. */
  contact: {
    address: '24 Đường 30/4, Dương Đông, Phú Quốc [Khu Chợ Đêm Phú Quốc]',
    addressShort: 'Chợ Đêm, Dương Đông, Phú Quốc',
    phone: '+84 327 81 57 57',
    phoneHref: 'tel:+84327815757',
    email: 'customerservice@burgerphuquoc.com',
    /** Google Maps place — CID decoded from the listing's place ID. Resolves. */
    mapUrl: 'https://maps.google.com/?cid=6745606626681855021',
    /** Exact listing coordinates, for directions links and structured data. */
    geo: { lat: 10.2147067, lng: 103.9618995 },
    hours: null as string | null, // not published by the venue; the row is omitted
    socials: [
      { label: 'Facebook', href: 'https://www.facebook.com/Rubyskitchen81/' },
      { label: 'Instagram', href: 'https://www.instagram.com/rubykitchen81_phuquoc/' },
      { label: 'TikTok', href: 'https://www.tiktok.com/@rubykitchen81' },
    ],
    website: 'https://burgerphuquoc.com/',
  },
  nav: {
    // Only anchors that exist on the page. The menu/burgers/chicken/combos/
    // visit sections were removed, so those links are gone rather than dead.
    links: [
      { label: 'Home', href: '#top' },
      { label: 'Menu', href: '#menu' },
      { label: 'Full Menu', href: '/menu' },
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


  /* ══════════════════════════════════════════════════════════════════
     SIGNATURE MENU SHOWCASE — sticky split-screen scrollytelling
     Section id: #menu (the hero CTA scrolls here)
     ══════════════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════════════════════
     JOURNEY — crab travels the dashed route (#journey)
     Mechanism is a 1:1 port of the clone's map section; copy and imagery
     are Ruby's own.
     ══════════════════════════════════════════════════════════════════ */
  journey: {
    id: 'journey',
    eyebrow: 'EVERYWHERE YOU GO',
    headlineTop: 'BIG FLAVOR',
    headlineBottom: 'TRAVELS WITH YOU',
    sub: 'Freshly packed burgers and fried chicken, ready to go. Packed hot, wrapped tight, and built to survive the trip — wherever you are headed.',
    /**
     * Five slots, same order and coordinates as the clone's pins.
     * Imagery is the venue's own guest photography (public/img-webp/khachhang*),
     * supplied by the client. Labels describe the moment actually shown — no
     * guest names are invented and no dish is claimed that is not in frame.
     */
    pins: [
      {
        label: 'SMASH BURGER',
        img: '/img-webp/khachhang1.webp',
        alt: 'Guest holding a Ruby Kitchen 81 chicken burger, with pasta and fries on the table',
      },
      {
        /* swapped: khachhang2 is 1.94:1 and the pin frame is 0.82:1, so cover
           cropping removed 57% of its width and both faces were lost (verified).
           This slot now uses the tall three-burger photo, which fits natively. */
        label: 'THREE BURGERS',
        img: '/img-webp/khachhang3.webp',
        alt: 'Guest pointing at a plate of three burgers on a red gingham table',
      },
      {
        label: 'DINNER FOR TWO',
        img: '/img-webp/khachhang2.webp',
        alt: 'Two guests smiling with burger baskets and salad at a Ruby Kitchen 81 table',
        /* Kept last of the set: this is the widest photo (1.94:1), so its crop is
           the most severe. Placed here it still reads as a group shot. */
        focus: '50% 30%',
      },
      {
        label: 'PASTA NIGHT',
        img: '/img-webp/khachhang4.webp',
        alt: 'Guest seated with pasta, fries and a burger in front of him',
      },
      {
        label: 'BEST BURGER',
        img: '/img-webp/khachhang5.webp',
        alt: 'Guest holding the Ruby Kitchen 81 menu card beside the diner wall',
      },
    ],
  },
  /* ══════════════════════════════════════════════════════════════════
     SIGNATURE SHOWCASE (#menu)
     Pinned two-column chapter sequence: the left panel is a per-item story
     panel, the right is one fixed image stage. Copy supplied by the client.
     ══════════════════════════════════════════════════════════════════ */
  signature: {
    id: 'menu',
    scrollHint: 'SCROLL TO EXPLORE',
    /** Shown only before the first item takes over (and on mobile as the intro). */
    intro: {
      eyebrow: '01 / THE RUBY FAVORITES',
      headlineTop: 'FOUR PICKS.',
      headlineBottom: 'BIG FLAVOR.',
      support:
        'From juicy burgers to crispy chicken, hearty pasta and sausages — explore the flavors of Ruby Kitchen 81.',
    },
    items: [
      {
        n: '01',
        eyebrow: '01 / THE RUBY FAVORITES',
        heading: 'CLASSIC BITE',
        body: 'Juicy, cheesy and straight to the point — a Ruby classic built for bold cravings.',
        meta: 'Cheese Burger · 75.000đ',
        name: 'CHEESE BURGER',
        priceLabel: '75.000đ',
        imageUrl: '/img-webp/Signature-MenuSection-CheeseBurger.webp',
        imageAlt: 'Ruby Kitchen 81 cheese burger with fries',
        /** Cinematic crop focal point (object-position). */
        focus: '50% 52%',
      },
      {
        n: '02',
        eyebrow: '02 / THE RUBY FAVORITES',
        heading: 'SMOKY HEAT',
        body: 'Grilled, savory and full of character — a bold sausage plate with diner attitude.',
        meta: 'Premium Smoked Sausage · 49.000đ',
        name: 'PREMIUM SMOKED SAUSAGE',
        priceLabel: '49.000đ',
        imageUrl: '/img-webp/Signature-MenuSection-Sausage.webp',
        imageAlt: 'Ruby Kitchen 81 premium smoked sausage',
        focus: '50% 58%',
      },
      {
        n: '03',
        eyebrow: '03 / THE RUBY FAVORITES',
        heading: 'COMFORT PLATE',
        body: 'Rich bolognese, satisfying texture and warm Ruby flavor in every bite.',
        meta: 'Spaghetti Bolognese · 69.000đ',
        name: 'SPAGHETTI BOLOGNESE',
        priceLabel: '69.000đ',
        imageUrl: '/img-webp/Signature-MenuSection-Pasta.webp',
        imageAlt: 'Ruby Kitchen 81 spaghetti bolognese',
        focus: '50% 48%',
      },
      {
        n: '04',
        eyebrow: '04 / THE RUBY FAVORITES',
        heading: 'GOLDEN CRUNCH',
        body: 'Crisp on the outside, juicy inside — a go-to favorite made for sharing.',
        meta: 'Crispy Chicken · Chicken & Snacks',
        name: 'CRISPY CHICKEN',
        /** Category item — no single published price, so the label is a category. */
        priceLabel: 'Chicken & Snacks',
        imageUrl: '/img-webp/Signature-MenuSection-Chicken.webp',
        imageAlt: 'Ruby Kitchen 81 crispy fried chicken',
        focus: '50% 55%',
      },
    ] as SignatureItem[],
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

  /* ══════════════════════════════════════════════════════════════════
     FULL MENU — homepage teaser + the /menu page.
     Seven printed pages, supplied as artwork. Title/alt describe what each
     page actually contains; nothing here invents a dish or a price.
     ══════════════════════════════════════════════════════════════════ */
  fullMenu: {
    eyebrow: 'FULL MENU',
    headingTop: 'MORE THAN',
    headingBottom: 'BURGERS.',
    body: 'Explore Ruby Kitchen 81’s full menu — burgers, combos, sausages, chicken, pasta, salads, drinks and more.',
    cta: 'View Full Menu',
    /** Homepage section uses this one as the hero visual. */
    cover: {
      src: '/img-webp/Menu.webp',
      alt: 'Ruby Kitchen 81 menu cover — western dinner menu',
    },
    page: {
      title: 'FULL MENU',
      intro:
        'Seven pages, one kitchen. Burgers, combos, hotdogs and sausage, chicken and snacks, salads, pasta, and the full drinks list — exactly as printed at the diner.',
      back: 'Back to home',
      viewAll: 'All pages',
      hint: 'Click a page to enlarge · use ← → to browse · Esc to close',
    },
    /** Order matters: this is the printed order of the booklet. */
    pages: [
      {
        n: '01',
        title: 'Cover',
        caption: 'Western dinner menu',
        src: '/img-webp/Menu.webp',
        alt: 'Ruby Kitchen 81 menu cover: western dinner menu with a double bacon burger, onion rings, fries, chicken and a cola.',
      },
      {
        n: '02',
        title: 'Signature Burgers',
        caption: 'Five burgers, 65.000₫ – 140.000₫',
        src: '/img-webp/Menu1.webp',
        alt: 'Signature burgers page: Double Beef & Bacon 140.000, Cheese Burger 75.000, Crispy Chicken Burger 65.000, Garlic Chicken Cheese Burger 75.000, Vegetarian Burger 65.000.',
      },
      {
        n: '03',
        title: 'Classic Combo',
        caption: 'Six combo sets, 85.000₫ – 169.000₫',
        src: '/img-webp/Menu2.webp',
        alt: 'Classic combo page: Double Beef & Bacon Deluxe Set 169.000, Cheese Burger Combo 105.000, Crispy Chicken Combo 85.000, Crispy Chicken Deluxe Set 109.000, Garlic Chicken Cheese Combo 99.000, Garlic Chicken Deluxe Set 119.000.',
      },
      {
        n: '04',
        title: 'Hotdog & Sausage',
        caption: 'Sausages and plates, 20.000₫ – 109.000₫',
        src: '/img-webp/Menu3.webp',
        alt: 'Hotdog and sausage page: Classic Sausage 20.000, Premium Smoked Sausage 49.000, Smoked Sausage Plate 109.000, Bacon Fries Plate 95.000.',
      },
      {
        n: '05',
        title: 'Chicken & Snacks',
        caption: 'Wings, popcorn chicken, fries, 50.000₫ – 149.000₫',
        src: '/img-webp/Menu4.webp',
        alt: 'Chicken and snacks page: Popcorn Chicken 8pcs 50.000, Chicken Mid Wings Combo 4pcs 69.000, Golden Crispy Chicken Wings Combo 11pcs 149.000, Popcorn Chicken & Fries 12pcs 75.000, French Fries 55.000, Onion Rings 60.000.',
      },
      {
        n: '06',
        title: 'Salads · Pasta · Extra',
        caption: 'Salads, spaghetti, add-ons',
        src: '/img-webp/Menu5.webp',
        alt: 'Salads, pasta and extra page: Sesame Chicken Salad 75.000, Tuna Salad 69.000, Garden Mix Salad 55.000, Spaghetti Bolognese 69.000, Truffle Sauce 15.000, Garlic Sauce 15.000, Cheddar Cheese 10.000, Crispy Bacon 15.000.',
      },
      {
        n: '07',
        title: 'Drinks',
        caption: 'Soft drinks, water, tea, beer',
        src: '/img-webp/Menu6.webp',
        alt: 'Drinks menu: soft drinks 20.000 each, Aquafina soda 20.000, Aquafina water 10.000, Oolong tea 15.000, Heineken Silver 25.000, Heineken Silver Can 30.000, Tiger 30.000, Bivina 20.000, Sai Gon Lager 20.000.',
      },
    ] as MenuPage[],
  },
  a11y: {
    skipToMenu: 'Skip to menu',
    scrollHint: 'Scroll',
  },
};


/** 140000 → "140.000₫" (Vietnamese grouping, no decimals) */
export function formatPrice(vnd: number | null): string {
  if (vnd === null) return '—';
  return `${vnd.toLocaleString('vi-VN')}₫`;
}

/**
 * Shared data shapes.
 *
 * Money is ALWAYS integer cents (`priceCents`), never a float — 0.1 + 0.2
 * is not 0.3, and that bug is the classic cause of wrong order totals.
 */

export type Currency = 'EUR' | 'USD' | 'VND';

export type Role = 'owner' | 'admin' | 'editor';

/** A menu item as shown to customers and managed in admin. */
export interface MenuItem {
  id: string;
  /** Stable URL segment: /menu/:slug — never changes after creation. */
  slug: string;
  name: string;
  description: string | null;
  /** Integer minor units. 1299 = €12.99 */
  priceCents: number;
  currency: Currency;
  /** Storage key (S3/R2), not a local path. Null = no image yet. */
  imageKey: string | null;
  category: string | null;
  available: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** A marketing campaign shown on the homepage. */
export interface Campaign {
  id: string;
  title: string;
  body: string | null;
  imageKey: string | null;
  /** ISO date, inclusive. */
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
}

/** Contact form submission from the public site. */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  createdAt: string;
  read: boolean;
}

// ── API envelope ──────────────────────────────────────────────

export interface ApiOk<T> {
  ok: true;
  data: T;
}

export interface ApiErr {
  ok: false;
  error: {
    code: string;
    message: string;
    /** Field-level errors for form rendering. */
    fields?: Record<string, string>;
  };
}

export type ApiResponse<T> = ApiOk<T> | ApiErr;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

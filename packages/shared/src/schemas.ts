/**
 * Validation schemas — shared by client forms, admin forms and the API.
 *
 * Using one schema in all three places is the only reliable way to stop
 * client/server validation from drifting apart.
 */
import * as v from 'valibot';

// ── Primitives ────────────────────────────────────────────────

export const CurrencySchema = v.picklist(['EUR', 'USD', 'VND']);
export const RoleSchema = v.picklist(['owner', 'admin', 'editor']);

/** Integer minor units, non-negative. Rejects floats and strings. */
export const PriceCentsSchema = v.pipe(
  v.number('Price must be a number'),
  v.integer('Price must be an integer number of cents'),
  v.minValue(0, 'Price cannot be negative'),
  v.maxValue(100_000_00, 'Price is unreasonably large'),
);

export const SlugSchema = v.pipe(
  v.string('Slug is required'),
  v.minLength(1, 'Slug is required'),
  v.maxLength(80, 'Slug is too long'),
  v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase words separated by dashes'),
);

export const EmailSchema = v.pipe(
  v.string('Email is required'),
  v.trim(),
  v.toLowerCase(),
  v.email('Enter a valid email address'),
  v.maxLength(254, 'Email is too long'),
);

/**
 * A storage key for an uploaded image.
 *
 * `types.ts` documents this as "Storage key (S3/R2), not a local path", but the
 * old schema accepted ANY string up to 500 characters — including
 * `javascript:alert(1)`, `//evil.example/x`, or a value carrying a quote. Those
 * values end up interpolated into a `src` attribute by the renderers, so an
 * unconstrained key is a stored-XSS precondition waiting for the first admin
 * renderer to exist.
 *
 * Restricted to a relative object key: path segments of letters, digits, dash,
 * underscore and dot, joined by single slashes, with an image extension. That
 * refuses every URL scheme, protocol-relative form and parent segment.
 */
export const ImageKeySchema = v.pipe(
  v.string('Image key is required'),
  v.maxLength(500, 'Image key is too long'),
  v.regex(
    /^(?![a-zA-Z][a-zA-Z0-9+.-]*:)(?!\/)(?!.*\.\.)(?:\/?[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.(?:webp|png|jpe?g|avif|gif)$/,
    'Image key must be a relative object key ending in webp, png, jpg, jpeg, avif or gif',
  ),
);

// ── Auth ──────────────────────────────────────────────────────

export const PasswordSchema = v.pipe(
  v.string('Password is required'),
  v.minLength(10, 'Password must be at least 10 characters'),
  v.maxLength(200, 'Password is too long'),
);

export const LoginSchema = v.object({
  email: EmailSchema,
  password: v.pipe(v.string(), v.minLength(1, 'Password is required')),
});

export type LoginInput = v.InferOutput<typeof LoginSchema>;

// ── Menu ──────────────────────────────────────────────────────

export const MenuItemCreateSchema = v.object({
  slug: SlugSchema,
  name: v.pipe(v.string('Name is required'), v.trim(), v.minLength(1, 'Name is required'), v.maxLength(120)),
  description: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(2000))), null),
  priceCents: PriceCentsSchema,
  currency: CurrencySchema,
  imageKey: v.optional(v.nullable(ImageKeySchema), null),
  category: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(60))), null),
  available: v.optional(v.boolean(), true),
  sortOrder: v.optional(v.pipe(v.number(), v.integer()), 0),
});

export const MenuItemUpdateSchema = v.partial(MenuItemCreateSchema);

export type MenuItemCreateInput = v.InferOutput<typeof MenuItemCreateSchema>;
export type MenuItemUpdateInput = v.InferOutput<typeof MenuItemUpdateSchema>;

// ── Campaign ──────────────────────────────────────────────────

export const CampaignCreateSchema = v.object({
  title: v.pipe(v.string('Title is required'), v.trim(), v.minLength(1), v.maxLength(160)),
  body: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(4000))), null),
  imageKey: v.optional(v.nullable(ImageKeySchema), null),
  startsAt: v.optional(v.nullable(v.pipe(v.string(), v.isoDate('Use YYYY-MM-DD'))), null),
  endsAt: v.optional(v.nullable(v.pipe(v.string(), v.isoDate('Use YYYY-MM-DD'))), null),
  active: v.optional(v.boolean(), true),
});

export const CampaignUpdateSchema = v.partial(CampaignCreateSchema);

export type CampaignCreateInput = v.InferOutput<typeof CampaignCreateSchema>;
export type CampaignUpdateInput = v.InferOutput<typeof CampaignUpdateSchema>;

// ── Contact ───────────────────────────────────────────────────

export const ContactSchema = v.object({
  name: v.pipe(v.string('Name is required'), v.trim(), v.minLength(1, 'Name is required'), v.maxLength(120)),
  email: EmailSchema,
  phone: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(40))), null),
  subject: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(160))), null),
  message: v.pipe(
    v.string('Message is required'),
    v.trim(),
    v.minLength(10, 'Please write at least 10 characters'),
    v.maxLength(5000, 'Message is too long'),
  ),
  /** Honeypot — must stay empty. Bots fill it in. */
  website: v.optional(v.literal(''), ''),
});

export type ContactInput = v.InferOutput<typeof ContactSchema>;

// ── Upload ────────────────────────────────────────────────────

export const PresignSchema = v.object({
  filename: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
  contentType: v.picklist(
    ['image/webp', 'image/png', 'image/jpeg', 'image/avif'],
    'Only webp, png, jpeg or avif images are allowed',
  ),
  sizeBytes: v.pipe(v.number(), v.integer(), v.maxValue(8 * 1024 * 1024, 'Max file size is 8 MB')),
});

export type PresignInput = v.InferOutput<typeof PresignSchema>;

// ── Pagination ────────────────────────────────────────────────

export const PaginationSchema = v.object({
  page: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1),
  perPage: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 20),
});

export type PaginationInput = v.InferOutput<typeof PaginationSchema>;

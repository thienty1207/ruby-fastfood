/**
 * Server entry — Bun.serve via Hono's bun adapter.
 */
import { app } from './app.ts';

const port = Number(Bun.env.PORT ?? 3000);

export default {
  port,
  fetch: app.fetch,
  development: Bun.env.NODE_ENV !== 'production',
} satisfies Bun.Serve.Options<unknown, never>;

if (Bun.env.NODE_ENV !== 'production') {
  console.log(`[api] listening on http://localhost:${port}`);
}

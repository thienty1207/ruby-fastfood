/**
 * Ruby Fastfood API — Hono on Bun.
 *
 * Route table (auth boundary is explicit, never a blanket wildcard):
 *
 *   GET  /api/health            public
 *   GET  /api/menu              public
 *   POST /api/contact           public
 *   GET  /api/campaigns         public
 *
 *   POST /admin/api/login       public   (must NOT sit behind requireAuth)
 *   POST /admin/api/logout      session
 *   GET  /admin/api/me          session
 *   *    /admin/api/*          session  + role
 *
 *   GET  /admin, /admin/*       served separately (see serveStatic below)
 */
import { Hono } from 'hono';

export const app = new Hono();

// ── Public API ────────────────────────────────────────────────
app.get('/api/health', (c) =>
  c.json({
    ok: true,
    data: { status: 'healthy', runtime: `bun ${Bun.version}`, ts: new Date().toISOString() },
  }),
);

// Placeholder — replaced by DB-backed routes in step 3.
app.get('/api/menu', (c) => c.json({ ok: true, data: { items: [], total: 0, page: 1, perPage: 20 } }));
app.get('/api/campaigns', (c) => c.json({ ok: true, data: [] }));
app.post('/api/contact', (c) => c.json({ ok: true, data: { received: true } }, 201));

// ── Admin auth (login is public by design) ────────────────────
app.post('/admin/api/login', (c) => c.json({ ok: true, data: { todo: 'session creation' } }));

// ── Everything else under /admin/api requires a session ───────
// NOTE: mounted with a path that excludes /login, so there is no
// redirect loop and no accidental auth on the login endpoint.
app.use('/admin/api/*', async (c, next) => {
  const p = c.req.path;
  if (p === '/admin/api/login') return next();
  const sid = getCookie(c, 'sid');
  if (!sid) return c.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in required' } }, 401);
  await next();
});

app.get('/admin/api/me', (c) => c.json({ ok: true, data: { todo: 'current user' } }));
app.post('/admin/api/logout', (c) => c.json({ ok: true, data: { todo: 'revoke session' } }));

// ── 404 ───────────────────────────────────────────────────────
app.notFound((c) => c.json({ ok: false, error: { code: 'NOT_FOUND', message: 'No such route' } }, 404));

app.onError((err, c) => {
  console.error('[api]', err);
  return c.json({ ok: false, error: { code: 'INTERNAL', message: 'Internal error' } }, 500);
});

// Tiny cookie reader so this file has no deps yet.
function getCookie(c: { req: { header: (n: string) => string | undefined } }, name: string): string | undefined {
  const raw = c.req.header('cookie');
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

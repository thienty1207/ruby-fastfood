// Minimal static file server for the built Astro output. QA ONLY — not deployed.
//
// Hardened while keeping behaviour identical for real routes:
//   - binds 127.0.0.1 explicitly, matching the loopback pin in both astro configs
//     (previously no hostname was passed, so Bun's default applied)
//   - rejects any request path that escapes the dist root instead of relying on
//     URL parsing to normalise dot segments
//   - keeps the directory-index and index.html fallbacks, so `astro build` output
//     still resolves exactly as before
//   - url.pathname is decoded exactly once before being resolved against the root,
//     then checked with path.relative, so `%2e%2e` cannot reach outside
import { serve } from 'bun';
import path from 'node:path';

const ROOT = path.resolve('./dist');

/** Resolve a request path inside ROOT, or return null if it escapes. */
function resolveInside(urlPath) {
  // `url.pathname` arrives already normalised by the WHATWG parser for the http
  // scheme, so a literal `../` never reaches here — but an ENCODED `%2e%2e`
  // survives as text, so decode exactly once and then test containment rather
  // than trying to pattern-match traversal strings.
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null; // malformed percent-encoding
  }
  // Reject NUL and control characters outright.
  if (/[\u0000-\u001f\u007f]/.test(decoded)) return null;
  // A backslash is a path separator on Windows; treat it as one on every platform
  // so the containment check below cannot be side-stepped with `..\`.
  const normalised = decoded.replace(/\\/g, '/');
  // Any surviving `..` segment is a traversal attempt, whether it came from the
  // raw URL or from decoding.
  if (normalised.split('/').some((seg) => seg === '..')) return null;

  const candidate = path.resolve(ROOT, '.' + path.posix.normalize(normalised));
  // path.relative is the real containment test: anything starting with ".." or
  // absolute means the candidate left ROOT.
  const rel = path.relative(ROOT, candidate);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return candidate;
}

serve({
  port: 5273,
  hostname: '127.0.0.1',
  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname;

    // A path that escapes the root is a hard 404 — never the index fallback.
    // Falling back would answer every traversal attempt with a 200, which masks
    // the attempt and makes the server look like it served something.
    const base = resolveInside(p);
    if (!base) return new Response('404', { status: 404 });

    const candidates = p.endsWith('/')
      ? [path.join(base, 'index.html')]
      : [base, path.join(base, 'index.html')];

    for (const f of candidates) {
      // Re-check every candidate, including the derived index path.
      const rel = path.relative(ROOT, f);
      if (rel.startsWith('..') || path.isAbsolute(rel)) return new Response('404', { status: 404 });
      const file = Bun.file(f);
      if (await file.exists()) return new Response(file);
    }

    // Soft 404 for a well-formed but unknown route: serve the built homepage,
    // exactly as the previous version did, so QA navigation is unchanged.
    const fallback = path.join(ROOT, 'index.html');
    const file = Bun.file(fallback);
    if (await file.exists()) return new Response(file);
    return new Response('404', { status: 404 });
  },
});
console.log('static server http://127.0.0.1:5273 (serving ' + ROOT + ')');

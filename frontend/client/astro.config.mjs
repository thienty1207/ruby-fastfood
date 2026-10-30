// Ruby Fastfood — public client site.
// Static output only: no adapter, no SSR. Hono serves the build in production.
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Static (SSG). No @astrojs/* adapter is needed — and none is added,
  // per the agreed stack (no SSR on the client).
  output: 'static',

  // Bind IPv4 loopback ONLY.
  //
  // Why not host:true — it binds 0.0.0.0 and exposes the dev server on the LAN
  // (e.g. http://10.16.8.216:4321), which we do not want for local work.
  // Why not the default (false) — on Windows that resolves only ::1, so
  // http://127.0.0.1:4321 is refused while http://localhost:4321 works.
  // Binding 127.0.0.1 keeps it local AND makes the IPv4 address work.
  server: { port: 4321, host: '127.0.0.1' },

  build: {
    // Keep Astro's own assets in a namespaced folder so they can never
    // collide with the public/ asset tree copied from the original site.
    assets: '_astro',
    inlineStylesheets: 'auto',
  },

  vite: {
    // ── CRITICAL ──────────────────────────────────────────────────────
    // Do NOT add PostCSS plugins, Tailwind, or autoprefixer.
    // `src/styles/site.css` is the original site's own compiled stylesheet.
    // It defines `md:` as min-width:1025px (NOT Tailwind's 768px default).
    // Any transformer that "normalizes" that breakpoint will make the
    // footer drift by 45-88px and break the QA baseline (docH 10429).
    // ──────────────────────────────────────────────────────────────────
    css: {
      devSourcemap: true,
    },
    build: {
      // GSAP + Lenis are already deduped; keep the output readable for QA.
      cssCodeSplit: false,
    },
  },
});

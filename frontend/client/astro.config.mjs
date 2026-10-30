// Ruby Fastfood — public client site.
// Static output only: no adapter, no SSR. Hono serves the build in production.
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Static (SSG). No @astrojs/* adapter is needed — and none is added,
  // per the agreed stack (no SSR on the client).
  output: 'static',

  // host:true binds both IPv4 and IPv6 — otherwise Windows resolves only ::1
  // and http://127.0.0.1:4321 is refused while http://localhost:4321 works.
  server: { port: 4321, host: true },

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

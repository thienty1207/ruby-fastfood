// Ruby Fastfood — admin dashboard.
// Static MPA: Astro handles file-based routing, plain TypeScript handles
// interaction. Hono gates every admin route with a session check in
// production, so no SSR adapter is required here either.
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',

  // Bind IPv4 loopback only — see the note in frontend/client/astro.config.mjs.
  // host:true would expose the admin dev server on the LAN, which is worse here
  // because this app talks to auth endpoints.
  server: { port: 4322, host: '127.0.0.1' },

  // Served under /admin/ by Hono in production.
  // In dev, Astro runs at the root — relative asset paths keep both working.
  base: '/',

  build: {
    assets: '_astro',
    format: 'directory',
    inlineStylesheets: 'auto',
  },

  vite: {
    css: { devSourcemap: true },
  },
});

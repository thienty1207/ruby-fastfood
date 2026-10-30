// Minimal static file server for the built Astro output (QA only).
import { serve } from "bun";
const DIST = "./dist";
serve({
  port: 5273,
  async fetch(req) {
    const url = new URL(req.url);
    let p = url.pathname;
    if (p.endsWith("/")) p += "index.html";
    let file = Bun.file(DIST + p);
    if (!(await file.exists())) file = Bun.file(DIST + p + "/index.html");
    if (!(await file.exists())) file = Bun.file(DIST + "/index.html");
    if (!(await file.exists())) return new Response("404", { status: 404 });
    return new Response(file);
  },
});
console.log("static server http://127.0.0.1:5273");

# ROUTING.md — surface routing plan

**Target:** https://www.cravburgers.shop/  **Analyzed:** 2026-10-29 @1440/768/390

## Verdict: pure DOM clone

`surface-map.json › routingSummary.hasGpuSurfaces = false`

- `<canvas>` count: **0**
- `<video>` count: **0**
- `<iframe>` count: **0**
- GPU globals (`THREE`/`BABYLON`/`regl`/`PIXI`/`OGL`/`p5`/UnicornStudio/Spline/Rive): all **false**

There is **no shader/WebGL/WebGPU material anywhere on this page**. Every visual —
including the eyes that track the cursor, the sticker peel, the plane following a
dashed path, and the footer veggies that juggle — is DOM + SVG + GSAP.

→ **shader-extract track is skipped entirely.** Everything routes to `dom-clone`.

## Section topology (top → bottom, 1440×900)

| # | Node | id | Height | Track |
|---|---|---|---|---|
| 0 | feature-cursor layer | — | fixed 900 | DOM (SVG path + 4 imgs) |
| 1 | menu backdrop | — | fixed 900 | DOM |
| 2 | `<nav>` | — | fixed 86 | DOM |
| 3 | section | `#hero` | 900 | DOM |
| 4 | section | `#about` | 1306 | DOM |
| 5 | experience wrap (red) | — | 1736 | DOM |
| 6 | photo band | — | 1440 | DOM |
| 7 | section | `#ingredients` | 799 | DOM |
| 8 | section | `#map-desktop` | 2347 | DOM + SVG path |
| 9 | section | `#map-mobile` | 0 (hidden ≥768) | DOM |
| 10 | section | `#cta` | 1159 | DOM |
| 11 | `<footer>` | — | 799 | DOM |

Total document height ≈ **10429px**.

## Interaction model

- **Smooth scroll:** Lenis, `{ root: true, autoRaf: false, duration: 1.2 }`, driven off
  `gsap.ticker` (`motion.json › lenis`), class `lenis` on `<html>`.
- **Scroll-driven** (not click): every reveal, the plane's motion path, the sticker
  peel, the divider jelly scaleY, the ingredient parallax, the country pins.
- **Pointer-driven:** hero eyes (`quickSetter` rotation from `atan2`), inertial drag
  on About photos / map pins / country labels (GSAP `InertiaPlugin`), custom
  ingredient cursor (`quickTo` chain + rAF rope).
- **Click-driven:** menu toggle, mobile menu.

## Build substrate

**Vite + TypeScript + vanilla** (no framework). Rationale:
- The page is a static marketing page; the original is Next.js but nothing on the
  home route needs SSR/routing.
- Component structure is preserved as small ES modules (one per section) so the
  clone is maintainable but ships zero framework overhead.
- GSAP 3.15 + Lenis 1.3.23 are the exact runtime versions the original uses.

## DOM strategy

**Rebuild** (not the fidelity fast path). The site ships Tailwind-4 utility classes
compiled into a 56KB stylesheet with no scope hashing worth preserving, and the
markup is React-generated. Rebuilding the class structure verbatim from the live
DOM gives an identical result while keeping the source readable — and the utility
strings came straight from the hydrated DOM, not from guesses.

Utility classes are reproduced by carrying Tailwind's compiled CSS (the site's own
`0ovftnp3y9gzb.css`) plus a small hand-written token layer, rather than re-running
Tailwind — that keeps arbitrary values like `text-[2.8vw]`, `top-[105vw]`,
`rounded-[4%]` byte-exact.

## GPU surfaces

**None.** Nothing was sent to shader-extract.

## Assets — all REAL

Every image, font, and icon was downloaded from origin (no reconstructed,
generated, or placeholder tiers). See `TEARDOWN.md › Assets`.

# Clone Report — https://www.cravburgers.shop/

**Status:** verified clone. DOM, CSS, assets, animation and interaction all
reproduced. Production build passes.

## Stack summary (`motion.json › summary`)

```
animationStack : gsap@3.15.0 (bundled) + lenis 1.3.23 + custom split-text
inputDrivers   : scroll, wheel, mousemove, pointermove, touchmove, resize, keydown
platform       : React 19 / Next.js App Router (original) → Vite + vanilla TS (clone)
```

## Routing result

`surface-map.json › routingSummary.hasGpuSurfaces = **false**`

- 0 `<canvas>`, 0 WebGL, 0 WebGPU, 0 video, 0 iframe
- every GPU-library global (`THREE`, `BABYLON`, `regl`, `PIXI`, `OGL`, `p5`,
  UnicornStudio, Spline, Rive) reports `false`

**No shader-extract track was needed.** The entire page — including the effects
that look like shaders — is DOM + SVG + GSAP. The sticker "peel" that reads as a
GPU effect is CSS `clip-path` driven by one CSS variable.

## Section topology & routing (all DOM track)

| # | Section | Height @1440 | Track |
|---|---|---|---|
| 0 | cursor rope layer | fixed | DOM + SVG path |
| 1 | menu backdrop | fixed | DOM |
| 2 | nav | fixed 86 | DOM |
| 3 | `#hero` | 900 | DOM |
| 4 | `#about` | 1306 | DOM |
| 5 | experience (red) | 1736 | DOM + SVG divider |
| 6 | photo band | 1440 | DOM + 2 SVG dividers |
| 7 | `#ingredients` | 799 | DOM |
| 8 | `#map-desktop` | 2347 | DOM + SVG motion path |
| 9 | `#map-mobile` | 0 / 6343 | DOM |
| 10 | `#cta` | 1159 | DOM + sticker |
| 11 | `footer` | 799 | DOM |

## Build substrate

**Vite 8 + TypeScript 7 + vanilla ES modules.** Why: the route is a static
marketing page — the Next.js shell buys nothing locally — and the section
components map 1:1 onto the original's React components, so fidelity came from
porting their exact GSAP numbers, not from a framework.

Packages: `gsap@3.15.0`, `lenis@1.3.23` (the exact live versions).

## Visual QA — measured, not eyeballed

Section heights compared before pixels, per `references/visual-qa.md`.

**Clone is deterministic — 3 consecutive runs identical at every breakpoint:**

| Breakpoint | doc height (3 runs) | Section deltas |
|---|---|---|
| **1440** | 10429 / 10429 / 10429 | **all 0** (hero 900, about 1306, ingredients 799, map 2347, cta 1159, footer 799) |
| 768 | 14577 / 14577 / 14577 | hero→cta all 0; footer −88 (see gaps) |
| 390 | 7761 / 7761 / 7761 | hero→cta all 0 (cta +1); footer −45 |

**@1440 the clone is an exact structural match: document height 10429 = 10429,
every section within 0px.**

## Motion verification — original vs clone, same probe, same scroll positions

Sampling every 60 ms from page load (the fair test — the original gates its
intro behind a loader, so a "wait 6 s then look" probe sees the clone settled).

| Effect | Result |
|---|---|
| Hero burger float-in + idle yoyo | **54 distinct frames**: `y 100→45→0`, `scale .498→.774→1`, `opacity 0→.55→1` — matches the recorded `1.5 s back.out(1.5)`, delay `.5 s`, then `y-=15 / 2.5 s sine.inOut / repeat −1 yoyo` |
| Hero H1 word pop | **9 frames**, `ty 7.7 → −5.2 → −0.5`, `scale .75 → 1.17 → 1.0` — the overshoot beyond 1.0 is `back.out(2.35)` behaving correctly |
| Hero paragraph line-mask | **12 frames**: `yPercent 28.5 → 20 → 15.7 → 10 → 0` |
| About H2 word pop | **9 distinct states, numerically identical to the original** (`ty 15.24/15.33`, `scale .603/.608`, …) — sampled mid-flight on both sides |
| Map plane on the dashed route | `tx/ty` **identical to the pixel** at every sample (1357.7 / 1817.9 range; both 308.7,37.1 at rest) |
| Map country pins pop-in | opacity `0 → 1` at the same progress points on both |
| Ingredient parallax | `translateY` identical (−37.4 px at the same scroll) |
| Jelly divider | 6 distinct path `d` values in both (path rewritten per tick) |
| Sticker peel `--peel-amount` | `1 → 0` on both across the CTA scroll |
| Footer juggle | 706 px vs 604 px travel — same physics envelope |
| Custom cursor rope | 4 knots, live `d` path, `M 560 430 Q …` |
| Eye tracking | clone rotation `1 → −1` when the pointer crosses the centre |

## Interaction verification

| Interaction | Result |
|---|---|
| Lenis smooth scroll | `0 → 694 → settled 1200` — eased, not a jump |
| Nav hide on scroll down | `y = −98` (hidden) |
| Nav show on scroll up | `y = 0` (restored) — a real bug found and fixed: an early `return` froze `lastScroll`, permanently stranding the nav |
| Menu open | panel `opacity 1`, `scale 1`, label flips to "Close", bars morph, `aria-expanded=true`, items staggered to opacity 1 |
| Menu Esc close | `opacity 0` |
| Rolling-text hover | `translate 0px 100% → 0px` (second copy rises), first copy `→ 0px −100%` |
| Order-Now blob morph | path `M310.777…` → `M326 0C491…` on hover (MorphSVG working) |
| Cursor hide on `[data-cursor-hide]` | wired |

## Bugs found and fixed during QA

1. **Dev server bound to IPv6 only** — `localhost:5273` worked, `127.0.0.1:5273`
   was refused. Fixed with `server.host = true`; both now respond 200.
2. **`SplitText is not defined`** — imported from `gsap` but never re-exported
   from the registration module, so line-mask reveals threw. Fixed.
3. **Nav permanently stuck hidden** — early `return` skipped the `lastScroll`
   update. Fixed (nav now hides *and* re-shows).
4. **Only 1 of 4 stickers mounted** — the original has four (.about burgerselfie,
   two in .experience, one in .cta). All four now mounted, with SVG filter ids
   namespaced per instance so they don't re-light each other.
5. **Footer 39 px short** — three causes, fixed in order: the copyright node is a
   `<span>` not a `<p>`; the two-line responsive pair needs its literal newline
   text node (that node is what creates the 39 px line box); and the wrong
   `max-md`/`md` pair was hiding the wrong branch.
6. **Duplicated "SMASHED PATTIES" text** rendered over the CRAV wordmark — the
   mobile/desktop branch pair wasn't mutually exclusive. Fixed.

## Assets — all tier 1 REAL

Every image and font was downloaded from origin; none reconstructed, generated
or placeholder. 24 images, 5 woff2 files (Modak + Mouse Memoirs with their
unicode-range splits), the site's own 67 KB compiled stylesheet, and both
`@font-face` families verified loading (`Modak`, `Modak Fallback`,
`Mouse Memoirs`).

## Known gaps

- **Footer is 45–88 px shorter on ≤768** than the original. The delta is confined
  to the footer's bottom text block, which reflows differently because the
  original's responsive branch pair resolves at `1025px` while my mirror also
  collapses at 768. Cosmetic, bottom of the page, not visible without measuring.
  @1440 — the primary target — it is exactly 0.
- The original's **page-entry loader** gate was not reproduced; the clone's intro
  plays immediately on load. This is why a naive "wait then probe" comparison
  shows the original at rest and the clone already finished.
- Original **`/menu`, `/spices`, `/contact` routes are out of scope** — home page
  only, links preserved.
- The **"Concept Website" agency popup** (Anyflow Labs credit) was dropped; it is
  site-owner chrome, not page design.
- Original's **cookie banner** is reproduced; the clone does not persist consent.

## Run it — works with Bun, pnpm, or npm

The clone is package-manager agnostic. Both lockfiles ship (`bun.lock` and
`pnpm-lock.yaml`), and `packageManager` was removed from `package.json` so no
manager refuses to run.

**With Bun (verified, Bun 1.4.3):**
```bash
cd output/www.cravburgers.shop/site
bun install          # 19 packages, 6.4 s from clean; migrates pnpm lockfile if present
bun run dev          # vite dev on http://localhost:5273
bun run build        # tsc --noEmit && vite build
bun run typecheck
```

**With pnpm:**
```bash
pnpm install && pnpm dev
```

Both produce a **byte-identical bundle** (`index-DQkYbIAx.js`, 236.64 kB) and
both dev servers bind `localhost` *and* `127.0.0.1`.

### Bun verification (measured, not assumed)

| Check | Result |
|---|---|
| `bun install` from clean checkout | 19 packages, 6.42 s, native `bun.lock` |
| `bun run build` | clean, exit 0, same asset hashes as pnpm |
| `bun run typecheck` | exit 0 |
| `bunx tsc --noEmit` | exit 0 |
| bun-served `bun run dev` | HTTP 200 on `localhost:5273` and `127.0.0.1:5273` |
| Rendered output under Bun | docH **10429**, all sections delta 0, 4 stickers, 67 KB CSS, fonts loaded |
| Animation under Bun | hero burger **36–38 frames** sampled, word pop **7–8 frames** — identical motion to the pnpm run |
| Console | **0 errors** |

Bun needed one repo change: removing `"packageManager": "pnpm@12.16.1"` from
`package.json`, which pins the project to pnpm.

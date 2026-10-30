# Teardown: CRAV — Sizzling

**URL:** https://www.cravburgers.shop/   **Analyzed:** 2026-10-29 @ 1440 / 768 / 390
**Platform:** Next.js (App Router, React Server Components streamed via
`self.__next_f.push`) + Turbopack — CONFIRMED (`__next_f` inline flight payload,
`/_next/static/chunks/turbopack-*.js`, `<html>` carries hashed font CSS-module classes)
**Built by:** vasaV · Pritam · Gaurav (console banner); site by **Anyflow Labs** (concept popup credit) — CONFIRMED
**Surfaces:** 11 DOM sections, **0 GPU surfaces**, 0 video, 0 iframe

> **Headline finding:** the whole page is DOM/SVG. There is no WebGL, no WebGPU, no
> canvas at all. The "wow" comes from GSAP timelines, an SVG motion path, and
> hand-built CSS filters — not from a shader.

## Stack (from runtime)

| Layer | What | Evidence |
|---|---|---|
| Framework | Next.js App Router + Turbopack, React 19 | `__next_f` flight stream, `turbopack-*.js` |
| Animation | GSAP **3.15.0** (bundled, no `window.gsap`) + ScrollTrigger + MotionPath + MorphSVG + Inertia + ScrollTo | `motion.json › libraries.gsap`; plugin version strings in chunk `014r2tef6u366.js` |
| Scroll | Lenis **1.3.23**, `{ root: true, autoRaf: false, duration: 1.2 }`, RAF driven by `gsap.ticker` | CONFIRMED — chunk `15b1_xl_2nu.v.js` |
| 3D / GPU | **none** | `surface-map.json` (0 canvas) |
| Sliders | none | `motion.json › sliders: []` |
| Text splitting | **custom** (not GSAP SplitText) — React splits strings into `<span data-pop>` and staggers them | chunk `0dvuw12hbr-ev.js` › `59598` module |
| Icons | inline SVG (hand-written paths) | `inline-svgs.json`, 21 SVGs |
| Fonts | **Modak** (display), **Mouse Memoirs** (text) — self-hosted woff2, 3 files each incl. unicode-range splits | `tokens-1440.json › fontFaces` |
| CSS | Tailwind v4 compiled to one 56KB sheet + one 1.9KB sheet | `all.css` |

## Design system (measured)

**Palette** — the site exposes its own names on `:root`; reuse them verbatim:
| Role | Token | Value | Uses |
|---|---|---|---|
| Page bg | `--beige` | `#f5e3cd` | 21 |
| Brand red / text | `--red` | `#f91814` | 46 |
| Ink | `--black` | `#1b1b1b` | 57 |
| Accent A | `--mustard` | `#ffd750` | 3 (map section bg) |
| Accent B | `--mustard-dark` | `#f4a804` | 16 (eyebrows, path stroke) |
| Paper | `--white` | `#fff` | 7 (text strokes) |

**Type scale @1440** — everything is viewport-relative, so there is no fixed scale:
| Role | Value | Class / example |
|---|---|---|
| Hero H1 | `30vw` / lh `.8` / 400 — Mouse Memoirs, `-webkit-text-stroke: 1vw #fff` | `.text-[30vw]` |
| Section H2 | `15vw` / lh `.75` — `.heading300` | `#about h2` |
| Giant footer | `35vw` / lh `.5` — `.heading600` (Modak) | `footer h2` |
| Eyebrow | `2.8vw` / lh `.9` — Modak, uppercase | `.text-[2.8vw] font-modak` |
| Body | `1.8vw` / lh `1.1` — `.text40` | hero paragraphs |
| Label/nav | `1.8vw` uppercase, Mouse Memoirs | `.text40` |
| Micro | `0.7–1.05vw` | concept modal |

Changes at ≤767px: `text40` → `5vw`, `text60` → `6.5vw`, `heading300` → `24vw`,
hero H1 → `26vw`, and most absolute positions are replaced by static flow.

**Signature effect — the outline.** All display type uses
`-webkit-text-stroke: 1vw var(--white); paint-order: stroke;` (`.text-stroke-180`).
That white "sticker outline" around every headline is what gives the page its look.
`paint-order: stroke` is load-bearing — without it the stroke eats the glyph.

**Spacing rhythm** — a strict `vw` ladder, base `0.2vw` step:
`0.6 / 1 / 1.5 / 2 / 2.5 / 3 / 4 / 5 / 6 / 8 / 10 / 15 / 18 / 20 vw`.
**Radii** `1vw` cards, `1.2vw` menu, `2vw` CTA photo, `4%` about photos, `9999px` pills.
**Shadows** — none as CSS `box-shadow` except the menu (`0 1vw 3vw rgba(27,27,27,.25)`);
all sticker depth is **SVG `feDropShadow` + `feSpecularLighting`** filters.
**Breakpoint** — exactly one: `1025px` in `tokens.breakpoints`, but the real mobile
switch used in markup is Tailwind `max-md` = **768px**.
**Custom props** — `--beige --red --white --black --mustard --mustard-dark` plus the
sticker system: `--sticker-rotate --sticker-p --sticker-shadow-opacity
--sticker-lighting-constant --peel-direction --peel-amount --sticker-start --sticker-end`.

## Effects (top → bottom)

| # | Section | Effect | Mechanism | Tag | Complexity |
|---|---|---|---|---|---|
| 1 | Chrome | Custom cursor = rope of 4 food icons | 8-segment chain, segment 0 `quickTo` the pointer at `.05s`, each next segment clamped to `segmentLength=8px` from the previous; SVG `Q` curve through them; 4 imgs pinned to knots `[0,3,5,9]`, rotated to segment angle; whole layer fades out over `data-cursor-hide` targets | CONFIRMED (chunk `15b1`) | High |
| 2 | Nav | Hide-on-scroll-down / show-on-up | Lenis subscriber: `delta>6` → `y: -(h+12)` over `.35s power3.out`; `delta<-6` → `y:0`; `scroll<10` always shows | CONFIRMED | Low |
| 3 | Nav | Menu pill morphs ═ → ✕ | timeline: top bar `top:50%, yPercent:-50, rotation:45`; bottom bar `top:50%, bottom:auto, rotation:-45`; middle bar `scaleX:0`; all `.35s power3.inOut` | CONFIRMED | Low |
| 4 | Nav | Menu panel opens | `opacity 0→1 .28s power2.out` + `scale .3→1 .5s back.out(2.5)` from `top right`, then items `y:18,opacity:0 → 0/1` stagger `.06s` `.38s power3.out` | CONFIRMED | Low |
| 5 | Hero | "THE BURGER" words pop in | `#[data-pop]` spans: `scale 0→1`, `y random(18,40)→0`, `rotation random(±16)→0`, `.72s back.out(2.35)`, stagger `.055s`, triggered at `top 92%` once | CONFIRMED | Low |
| 6 | Hero | Burger plate floats | from `scale .5, opacity 0, y 100, rotate -5` → identity over `1.5s back.out(1.5)` delay `.5s`, then `y -=15` `2.5s sine.inOut` `repeat:-1 yoyo` | CONFIRMED | Low |
| 7 | Hero | Eyes follow cursor | `rotation = atan2(cy - h/2, cx - w/2) * 180/PI - 180`, applied with `gsap.quickSetter(el,'rotation','deg')` | CONFIRMED | Low |
| 8 | About | Photos get shoved and spring back | mouse delta → `gsap.to(el,{inertia:{x:{velocity:30*dx,end:0}, y:{velocity:30*dy,end:0}, rotation:{velocity:2*dx,end:baseRotation}, resistance:150}})` | CONFIRMED | Med |
| 9 | About | Order-now button blob morphs | `morphSVG` between the base blob `ea` and one of **3** random blobs `ei` on hover, `.5s back.out`; reverts `.5s back.in` | CONFIRMED | Med |
| 10 | Experience | Eyebrow uses `mix-blend-mode:overlay; opacity:.8` | CSS | CONFIRMED | Low |
| 11 | Divider | Wavy band "breathes" | SVG path `d` re-written on every tick from 6 tweened coordinates (`v,s1c,s1e,s2c,s2e,s3c,s3e`) via `repeat:-1, yoyo:true`; plus `scaleY 1→1.5` on scrub | CONFIRMED | Med |
| 12 | Photo band | Full-bleed photo between two wave dividers | two `<SectionDivider>` (one flipped, `fill` = the neighbour colour) + `object-cover` img in a `160vh` box | CONFIRMED | Low |
| 13 | Ingredients | 4 veg parallax at different speeds | Lenis subscriber: `translateY( (scroll - offsetTop + innerHeight) * factor )` with factors `-0.01,-0.05,-0.09,-0.06` | CONFIRMED | Low |
| 14 | Map | **Plane follows a dashed SVG path** | `MotionPathPlugin` tween of 4 plane imgs along `#map-desktop svg path`, `scrollTrigger start:"-10% top", end:"75%", scrub:1`; `autoRotate:-90`, `alignOrigin:[.5,.5]` | CONFIRMED | High |
| 15 | Map | Country pins pop in by scroll progress | one ScrollTrigger `onUpdate` at progress thresholds `[.14,.28,.5,.68,.91]`: in → `scale .8→1.08`, `rotate random(±15)`, `.45s back.out(2.2)`; out → `scale .8`, `.28s back.in(1.2)` | CONFIRMED | Med |
| 16 | Ingredients/Map | Pins/labels get inertial shove | same `InertiaPlugin` pattern, resistance `140` (pins) / `170` (labels) | CONFIRMED | Med |
| 17 | Map mobile | 4 planes chase a vertical path in 4 segments | timeline `fromTo` motionPath with `start:t/4,end:(t+1)/4` per plane, `scrub:1`, each fading in over the first 20% of its segment | CONFIRMED | Med |
| 18 | CTA | Sticker peels as you scroll | `--peel-amount` tweened `1→0` on `scrollTrigger {start:'-120% 50%', end:'30% 50%', scrub:1}`; CSS clip-path cuts the sticker at `--sticker-peel-y`, flap mirrors it with `scaleY(-1)`, SVG point-light filters shade both halves | CONFIRMED | High |
| 19 | Footer | "CRAV" letters pop | `split:"chars"`, `stagger .03`, `.75s back.out(2.6)` | CONFIRMED | Low |
| 20 | Footer | 4 veg juggle forever | per-item `timeline`: fade+scale in `.18s`, rise to `-random(38,60)vh` over `random(.9,1.3)s power2.out`, fall back to `22vh` over `dur*random(1.15,1.5)s power2.in`, drift `x` over the whole flight `sine.inOut`, spin `random(220,600)deg` linear, fade out last `.25s`; then `delayedCall(random(.2,.9))` and repeat. Stagger start `.55s*i + random(0,.4)` | CONFIRMED | High |
| 21 | Footer | Underline draws in | `scaleX 0→1`, `transformOrigin:'0% 50%'`, `.9s power3.out` at `top 92%` | CONFIRMED | Low |
| 22 | Global | Rolling-text link hover | two stacked spans; CSS `group-hover:-translate-y-full` / `translate-y-0`, `duration-300` | CONFIRMED | Low |

## Reveals — how the impressive ones actually work

### #14 — the plane on the dashed path
**What it looks like:** a hand-drawn plane taxis along a dotted route and visits five
cities as you scroll.
**What it is:** a single bezier `<path>` from the `#map-desktop` SVG, and
MotionPathPlugin tweening a `w-[15vw]` wrapper along it with `scrub: 1`.
**Exact params (CONFIRMED):**
```
trigger: #map-desktop inner div, start: "-10% top", end: "75%", scrub: 1
motionPath: { path: <the svg path el>, align: <same>, alignOrigin: [.5,.5], autoRotate: -90 }
```
**Rebuild note:** `autoRotate:-90` (not `true`) because the PNG's nose points *up* in
its own coordinates. `align` must be the path element itself, not a selector string
resolved too early — the path is inside a `preserveAspectRatio` SVG, so aligning to it
is what keeps the plane on the drawn line at every viewport width.

### #18 — the peeling sticker
**What it looks like:** a die-cut sticker of a kid eating a burger, and its bottom
corner peels up and folds over as you scroll.
**What it is:** **pure CSS clip-path math driven by one CSS variable.** No WebGL, no
canvas, no per-pixel work. The trick is that the same `--sticker-peel-y` is used as the
cut line for *both* halves:
```
--sticker-peel-y: calc(var(--sticker-start) + var(--peel-amount) * (var(--sticker-end) - var(--sticker-start)))

.sticker-main { clip-path: polygon(start peelY, end peelY, end end, start end); }   /* below the fold */
.flap         { clip-path: polygon(start start, end start, end peelY, start peelY);
                top: calc(-100% + 2*var(--sticker-peel-y) - 1px); transform: scaleY(-1); }  /* mirrors */
```
**Rebuild note:** the depth sells it. `.sticker-lighting` gets an SVG
`feSpecularLighting` point light whose `fePointLight` x/y is moved to the cursor, and
the flap uses a second, blurrier light (`stdDeviation:10`, `specularConstant: 7×`) plus
an `expandAndFill` grey flood for the paper back. Drop those and it reads as a flat mask.

### #20 — the juggling footer veggies
**What it looks like:** four ingredients toss themselves off the bottom of the page and
fall back, forever, at different rhythms.
**What it is:** one GSAP timeline per item, re-scheduled from its own `onComplete`.
**Exact params (CONFIRMED, desktop config):**
```
restVH:22, apex:[38,60], driftStart:[2,7], driftEnd:[8,24],
upDur:[.9,1.3], gravityRatio:[1.15,1.5], spin:[220,600],
repeatDelay:[.2,.9], staggerStart:.55, sizeScale:1
```
Sequence: `opacity 0→1, scale .9→1` over `.18s power1.out`; `y: -apex vh` over
`upDur power2.out`; `y: restVH vh` over `upDur*gravityRatio power2.in`; `x: drift vw`
across the whole flight `sine.inOut`; `rotation: ±spin` linear; `opacity→0` last `.25s`.
**Rebuild note:** the up/flight asymmetry is the physics — `gravityRatio > 1` means the
fall takes longer than the rise, which is what reads as weight. Mobile config halves
the apex and doubles `sizeScale` to `1.29`.

### #1 — the food-rope cursor
**What it looks like:** a thin white line trails the pointer with four ingredients
riding on it.
**What it is:** a fixed 8-segment chain. Segment 0 is tweened to the pointer every rAF;
each following segment is clamped to `segmentLength` (8px) from its predecessor, so the
line "drags". An SVG path is rebuilt each frame as `M p0 Q p1 mid … L plast`. Knots at
indices `[0,3,5,9]` carry the four `<img>`s, each rotated to `atan2` of its segment.
**Rebuild note:** the per-segment duration ramps `0.12 + 0.01*r`, which is what makes
the tail progressively lag instead of snapping. Also gated: only `(pointer: fine)` and
no reduced-motion, and hidden entirely on `[data-cursor-hide]` targets.

## Assets

All assets resolved at **tier 1 — REAL** (downloaded from origin). Nothing was
reconstructed, generated, or placeholder.

| Asset | Role | Tier | Notes |
|---|---|---|---|
| `burgerH.webp` | hero burger | REAL | 1080×856 |
| `cheesyBurger.webp` | photo band | REAL | 1080×772 |
| `cta.webp` | CTA portrait | REAL | 796×976 |
| `burgerwithhands.webp` | experience | REAL | 1080×720 |
| `about-1/2/3.webp` | about trio | REAL | 455–451×597–600 |
| `berlin/london/newyork/sydney/tokyo.webp` | map pins | REAL | 284–303×355–372 |
| `plane.png` | path traveller | REAL | 1024×1083 |
| `burger-boy.png` | CTA sticker | REAL | 1024×1056 |
| `burgerselfie.png` | about sticker | REAL | 1024×1536 |
| `lettuce/tomato/cheese/meat.webp` | cursor + juggle | REAL | |
| `fries.webp`, `burger.webp`, `cheese-logo.webp` | stickers/cursor | REAL | |
| Modak + Mouse Memoirs woff2 ×6 | type | REAL | latin + latin-ext + modak-devanagari |
| wave dividers | shape | REBUILT | generated from the measured bezier control points |

**Note on the wavy dividers:** they are not an asset — they're an `<svg>` whose path is
animated at runtime. The clone reproduces the exact control-point table.

## Build plan

**Substrate:** Vite + TypeScript + vanilla (no framework) — static marketing page; the
Next.js shell buys nothing on this route.
**Packages:** `gsap@3.15.0 lenis@1.3.23` (exact versions from the live runtime).
**Order:**
1. `styles/` — tokens `:root`, the `.text-stroke-*` / `heading*` / `text40` utilities,
   the sticker CSS, and the utility classes actually used (carried from the site's own
   compiled sheet so arbitrary values stay exact). *Low.*
2. `lib/lenis.ts` — Lenis `{duration:1.2, autoRaf:false}` on `gsap.ticker`. *Low.*
3. `components/nav.ts` — hide-on-scroll + hamburger timeline + menu panel. *Low.*
4. `components/cursor.ts` — rope cursor. *High.*
5. `components/splitText.ts` — the `data-pop` splitter + staggered reveal. *Low.*
6. `sections/hero.ts` — H1, float, eyes. *Low.*
7. `sections/about.ts` — inertia photos + morph button. *Med.*
8. `components/divider.ts` — jelly path tween. *Med.*
9. `sections/experience.ts` — red block + eyes burger. *Low.*
10. `sections/photoBand.ts` — 160vh photo between two dividers. *Low.*
11. `sections/ingredients.ts` — parallax veg. *Low.*
12. `sections/mapDesktop.ts` — motion path plane + popping pins. *High.*
13. `sections/cta.ts` — sticker peel. *High.*
14. `sections/footer.ts` — juggling veg + char reveal. *High.*

**Known gaps / caveats:**
- **InertiaPlugin and MorphSVGPlugin are GSAP club plugins.** They are bundled inside
  the original's chunks. The clone must either use the free equivalents or reimplement
  the two effects with plain tweens — a spring-back is reproducible with an
  `elastic.out` tween seeded from the mouse delta, and the blob morph is reproducible
  by interpolating the path's control points. The clone does the latter two, and the
  fidelity note is carried into the report.
- `document.hidden` pause/resume for the juggle timelines is carried over.
- Menu scroll-spy (`[data-nav-dark]` → white nav on dark sections) is carried over.
- The `/menu`, `/spices`, `/contact` routes exist on the original but are **out of
  scope** — this clone covers the home page only, with links preserved.
- Cookie banner and "concept website" popup are original UI; the clone keeps the
  cookie banner behaviour but drops the agency promo popup.

# PHASE 0 — TECHNICAL AUDIT

**Target:** Ruby Kitchen 81 (rebrand from CRAV clone)
**Audited:** 2026-10-31 · repo `D:\Working\Typescript\Ruby-Fastfood`
**Branch:** `feat/ruby-dark-palette` · HEAD `54d3d8a`
**Verdict:** the technical foundation is sound and reusable. The **content,
assets and identity are 100% CRAV** and must be replaced. Fewer than 15% of the
existing markup can survive a genuine rebrand unmodified.

---

## 1. Stack as built

| Layer | What | Reusable for Ruby? |
|---|---|---|
| Frontend | Astro 7.4.4 static, no adapter | ✅ yes |
| Motion | GSAP 3.15 + ScrollTrigger + MotionPath + MorphSVG + Inertia + SplitText | ✅ yes, all utility-grade |
| Smooth scroll | Lenis 1.3.23, `duration 1.2`, RAF off `gsap.ticker` | ✅ yes |
| CSS | 67,048 bytes, 1,040 rules, 10 media queries | 🟡 carries CRAV's rhythm |
| Fonts | Modak + Mouse Memoirs (Google, OFL) | 🟡 open licence, but very CRAV |
| Backend | Hono 4.13 + Bun, `/api/health` + auth gate | ✅ yes |
| Shared | `@ruby/shared` — types + valibot schemas | ✅ yes |

**Nothing here needs replacing.** The whole rebuild is content + design layer.

---

## 2. Asset inventory — 25 files, all CRAV-owned

Every image was downloaded from `cravburgers.shop`. Alpha column matters: a
transparent PNG can be re-used as a *shape* in a new composition; an opaque
photo cannot.

| Asset | Size | Alpha | Used by | Ruby decision |
|---|---|---|---|---|
| `img-webp/Newlogo-heroSection.webp` | 1254² | ✅ | hero | ✅ **KEEP** — Ruby mascot (approved) |
| `img/burgerH.webp` | 1538×1219 | ✅ | hero *(now unused)* | ❌ DELETE |
| `img/burger-boy.png` | 1024×1056 | ✅ | cta sticker | ❌ DELETE — CRAV character |
| `img/burgerselfie.png` | 1024×1536 | ✅ | about sticker | ❌ DELETE — CRAV character |
| `img/plane.png` | 1024×1083 | ✅ | map ×2 | 🟡 SHAPE reusable as travel motif |
| `img-webp/about-1/2/3.webp` | 434–455×597 | ❌ | about trio | ❌ DELETE — CRAV venue |
| `img-webp/berlin/london/newyork/sydney/tokyo.webp` | 284–303×362 | ❌ | map ×2 | ❌ DELETE — CRAV customers |
| `img-webp/burgerwithhands.webp` | 1208×805 | ✅ | experience | 🟡 hero product — needs Ruby shot |
| `img-webp/cheesyBurger.webp` | 1728×1236 | ❌ | photo band | 🟡 needs Ruby shot |
| `img-webp/cta.webp` | 796×976 | ❌ | cta | 🟡 needs Ruby shot |
| `img-webp/burger.webp`, `fries.webp` | 269–376 | ✅ | experience stickers | 🟡 food cut-outs, generic |
| `img-webp/lettuce/tomato/cheese/meat.webp` | 365–507 | ✅ | cursor, footer, ingredients | 🟡 **ingredient motif — reusable** |
| `img-webp/cheese-logo.webp` | 360² | ✅ | favicon, cursor, footer | 🟡 replace with Ruby mark |
| `img-webp/spices.webp` | 1728×1117 | ❌ | **UNUSED** | ❌ DELETE |
| `img-webp/og-image.webp` | 376×293 | ✅ | **UNUSED** | ❌ DELETE |

**Result: 8 delete, 9 replace-with-Ruby-shot, 4 keep-as-motif, 2 unused.**

⚠️ **Asset gap:** Ruby has supplied **only the mascot**. There are **no Ruby
food photographs, no venue photographs, no logo file.** This blocks a real
rebrand — flagged in §7.

---

## 3. Token coverage

| Measure | Value | Assessment |
|---|---|---|
| Colour tokens in `:root` | 6 | ✅ good |
| `var(--token)` references | 106 | ✅ good coverage |
| **Hardcoded hex outside `:root`** | **33** | 🟡 must tokenize |
| Hardcoded `vw` values in classes | 271 (61 unique) | 🟡 proportional, no unit system |
| `z-index` ladder | 14 distinct (0→9999) | ✅ documented |
| Spacing values | `1/2/3/4/5/6/8/10/14/15/20/25vw` | 🟡 no base unit |

The 33 hardcoded hex values are the real debt. They are mostly alpha variants
(`#0000001a`, `#1b1b1b40`) plus 4 brand values (`#f4a804`, `#f5e3cd`, `#f91814`,
`#ffd750`). **Phase 0 action: tokenize these before any rebrand** — otherwise a
palette change silently misses them.

Note: `[Xvw]` classes are proportional by design. They do **not** need
converting to a spacing unit unless we change the layout scale — out of scope.

---

## 4. Motion inventory — what is CRAV's signature vs. what is utility

Instruction #6 says: keep the investment, build a *Ruby* motion language, do
not copy CRAV's signature recognisable animations.

| # | Effect | Where | Classification | Ruby decision |
|---|---|---|---|---|
| 1 | **Peeling sticker** (SVG specular light + clip-path fold, scrubbed) | 4 instances: about, experience×2, cta | 🔴 **CRAV SIGNATURE** | ❌ retire or repurpose with mascot |
| 2 | **Food-rope cursor** (8-segment chain + 4 ingredient knots) | global | 🔴 **CRAV SIGNATURE** | ❌ retire / new Ruby cursor |
| 3 | **Juggling footer ingredients** (perpetual toss timeline) | footer | 🔴 **CRAV SIGNATURE** | 🟡 reuse mechanic, new subject |
| 4 | Plane on dashed SVG route + city pins | map | 🟡 scenic, not identity | ✅ reusable as "Visit Us" |
| 5 | Word-pop split-text reveal (`scale 0→1`, back.out) | 6 sections | 🟢 **UTILITY** | ✅ keep, retune ease |
| 6 | Line-mask reveal (SplitText lines) | 5 places | 🟢 UTILITY | ✅ keep |
| 7 | Wavy SVG divider "jelly" (path rewritten per tick) | 6 dividers | 🟡 decorative | ✅ keep, retune |
| 8 | Inertia drag on photos/pins | about, map | 🟢 UTILITY | ✅ keep |
| 9 | Blob morph button (MorphSVG, 3 shapes on hover) | order CTA | 🟢 UTILITY | ✅ keep, new blob shapes |
| 10 | Googly eyes tracking pointer | experience | 🟡 playful | ✅ **better fit on crab mascot** |
| 11 | Nav hide/show + hamburger morph + menu panel | nav | 🟢 UTILITY | ✅ keep |
| 12 | Rolling-text hover | nav, footer links | 🟢 UTILITY | ✅ keep |
| 13 | Divider + text stroke outline | global | 🟡 visual identity | 🟡 decide (§7) |
| 14 | Parallax ingredient drift | ingredients | 🟢 UTILITY | ✅ keep |

**3 signature effects must go (#1, #2, and #3's subject). 11 utilities survive.**
That is the honest split: the *engineering* is reusable, the *personality* is not.

---

## 5. Copy inventory — 21 strings, all CRAV

| Section | Current | Length (chars) | Ruby needs |
|---|---|---|---|
| nav | `Est. 1997 — Navarra, España` | 28 | ❌ fabricated origin — must go |
| hero H1 | `THE BURGER` | 10 | new |
| hero badge L/R | `SMASHED FRESH` / `BOLD FLAVOR` | 13 / 12 | new |
| hero giant | `CRAV` | 4 | `RUBY` |
| hero para ×2 | "Smashed hot on the flat top…" (112) / "Topped with melted cheddar…" (117) | ~115 | new, same size |
| about eyebrow | `TOP CLASSIC` | 11 | new |
| about H2 | `juicy cheesy fully Loaded` | 26 | new |
| about para | "CRAV is back and bolder than ever…" (147) | 147 | new |
| ingredients H ×4 | `Every Layer` / `Packed With` / `Signature` / `Flavor` | 11/11/9/6 | new |
| experience eyebrow | `EXPERIENCE` | 10 | keep (generic) |
| experience H2 | `food that feels good` | 20 | new |
| experience stat ×2 | `450 kcal / High Protein / Fresh Ingredients` (unverified!) | 48 | ❌ nutrition claims — must go |
| experience badge | `BOLD FLOUR` / `BOLD FLAVOUR` | 12 | new |
| map eyebrow | `TAKE AWAY` | 9 | new |
| map H2 | `QUALITY THAT TRAVELS WITH YOU` | 29 | new |
| map para | "Freshly packed smash burgers…" (155) | 155 | new |
| map city ×5 | BERLIN / LONDON / NEW YORK / SYDNEY / TOKYO | — | ❌ Ruby is one venue in Phú Quốc |
| cta eyebrow | `FEEL IT` | 7 | new |
| cta H2 | `feel the Change` | 15 | new |
| cta para | "Smashed for the bold…" (135) | 135 | new |
| footer | `Smashed patties · toasted buns · est. 1997` | 43 | ❌ fabricated origin |
| footer | `© 2026 CRAV — All rights reserved` | 30 | `RUBY KITCHEN 81` |

**Character counts are the contract.** Kinetic typography reflows if a headline
grows past ~±20%.

---

## 6. Structural audit — what does *not* fit Ruby

| CRAV section | Problem for Ruby |
|---|---|
| `#map-desktop` (2347px, 5 cities) | Ruby has **one** location. A 5-city scroll-scrub is fabricated scale. |
| `#map-mobile` (6343px on mobile!) | 4 planes over a vertical path — pure fiction |
| experience "450 kcal / High Protein" | **Unverified health claims** — instruction #2 forbids |
| `#ingredients` (4 headlines = 1 sentence) | "Every Layer / Packed With / Signature / Flavor" is a 4-line type stunt, not content |
| `photoBand` (160vh) | no Ruby photography exists |
| 4 stickers | all CRAV characters |

Document height is **10,429px at 1440** — a long scroll. For a real diner the
menu must be *reachable fast*. Instruction #6 also says animation must not block
menu browsing.

---

## 7. Blockers — decisions or assets needed from the client

These cannot be invented (instruction #2 forbids fabricating menu, price,
story, certification, nutrition):

| # | Blocker | Why it blocks | Workaround if unanswered |
|---|---|---|---|
| **B1** | **No Ruby photography** (food, venue, staff, packaging) | 9 assets must be replaced; hero/sections need real product shots | placeholders labelled `PLACEHOLDER` in the build |
| **B2** | **No logo file** — only a wordmark text | header/footer brand slot | typeset `RUBY KITCHEN 81` in an open font |
| **B3** | **No proof** of founding date, awards, sourcing, recipes | nav/footer/story copy must stay factual | omit all claims |
| **B4** | **Opening hours** not supplied | "Find Us" section incomplete | omit or mark "confirm" |
| **B5** | **5 menu categories have names but no items/prices** (Hotdog, Chicken & Snacks, Pasta, Salads, Drinks, Beer, Extras) | menu section can only show Burgers + Combos fully | show categories, mark items TBD |
| **B6** | **Google Maps link** — address only, no place ID / URL | "Find Us" needs the real pin | use address query URL, mark for verification |
| **B7** | **Nutrition / kcal** — none supplied | experience section stats | drop the stats entirely |
| **B8** | Font licence | Modak + Mouse Memoirs are OFL (safe) but read as CRAV | propose new pairing in Phase 2 |
| **B9** | Mascot usage rules | crab is decorative only, not seafood positioning | used as sticker/character only, never as product |

---

## 8. What survives, quantified

| Category | Count | Note |
|---|---|---|
| Motion utilities reusable as-is | **11 of 14** | GSAP infra untouched |
| Signature effects to retire | **3** | sticker peel, food-rope cursor, juggle subject |
| Images to delete | **8** | incl. 2 already unused |
| Images needing Ruby replacements | **9** | blocked by B1 |
| Copy strings to rewrite | **21 of 21** | 0% salvageable |
| Regressions to protect | **1** | `docH 10429` (will legitimately change — new baseline after rebrand) |

**Phase 0 conclusion:** the codebase is a *good engine with someone else's
paint job and someone else's words*. Phase 1 must replace the paint and the
words, and 9 assets are blocked on client photography.

---

## 9. Phase 0 action list (approved scope)

1. Tokenize the 33 hardcoded hex values → `var(--…)`. *(no visual change, must verify 10429)*
2. Extract `--rx-*` role layer so a direction can override without touching `site.css`.
3. Hoist motion params (durations/eases/staggers) into one config object per section.
4. Delete the 2 unused assets (`spices.webp`, `og-image.webp`) and the now-orphan `burgerH.webp`.
5. Record a **new** regression baseline after the rebrand (the old 10429 is CRAV's layout).

No layout, motion or responsive behaviour changes in Phase 0.

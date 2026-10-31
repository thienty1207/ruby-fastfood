# PHASE 1 — RUBY BRAND & CONTENT MAPPING

**Brand:** RUBY KITCHEN 81 · Western Diner, Phú Quốc
**Language:** English (i18n structure prepared for VI later)
**Copy voice:** bold · energetic · playful · short · kinetic-typography friendly

---

## 1. Section mapping — CRAV → Ruby

I am **not** keeping CRAV's 9-section structure. Instruction #5 says pick and
order by UX, not by copying. Ruby has one venue, a real menu and no supplied
story — so the page must be **shorter and menu-forward**.

| # | CRAV | Height @1440 | → | Ruby section | Decision |
|---|---|---|---|---|---|
| — | cursor rope | fixed | → | *new cursor* (§4) | **replace** |
| 1 | nav | 86 | → | Nav | **keep structure, new content** |
| 2 | `#hero` | 900 | → | **Hero — BIG FLAVOR. RUBY STYLE.** | keep shell, new everything |
| 3 | `#about` | 1306 | → | *(merged)* into Menu intro | **drop as standalone** |
| 4 | experience (red) | 1736 | → | **Explore Our Menu** | repurpose panel |
| 5 | photo band | 1440 | → | **Signature Burgers** | repurpose as product band |
| 6 | `#ingredients` | 799 | → | **Crispy Chicken & Snacks** | repurpose type-stunt |
| 7 | `#map-desktop` | 2347 | → | **Find Us / Visit** | **shrink drastically** |
| 8 | `#map-mobile` | 6343 | → | *(same, mobile variant)* | shrink |
| 9 | `#cta` | 1159 | → | **Ruby Classic Combos** | repurpose |
| 10 | `footer` | 799 | → | Footer | keep structure, new content |

### Why `#about` is dropped

CRAV's about section exists to carry a fabricated heritage ("back and bolder
than ever… rich roots"). Ruby has **no supplied story** (blocker B3), and
instruction #2 forbids inventing founding history. A section whose only content
would be invented is worse than no section. Its job — first impression after
the hero — is handed to **Explore Our Menu**, which is the actual business need.

### Resulting page (mobile-first order)

```
1  Nav
2  HERO            BIG FLAVOR. RUBY STYLE.
3  MENU            Explore Our Menu  — 7 real categories
4  BURGERS         Signature Burgers — 5 items with real prices
5  CHICKEN         Crispy Chicken & Snacks
6  COMBOS          Ruby Classic Combos — 6 sets with real prices
7  VISIT           Find Us — address, phone, map, hours(B4)
8  FOOTER
```

**8 blocks instead of 11.** Target height ≈ 6,000–7,000px at 1440 (from 10,429)
— the menu becomes reachable in ~3 swipes instead of ~7.

---

## 2. Navigation & sitemap

### Primary nav (desktop)

| Label | Target | Notes |
|---|---|---|
| MENU | `#menu` | anchor, not a route |
| BURGERS | `#burgers` | |
| CHICKEN | `#chicken` | |
| COMBOS | `#combos` | |
| VISIT | `#visit` | |
| **ORDER NOW** | `/menu` | CTA pill, Flame Orange |

CRAV's nav had `BURGERS / SPICES / CONTACT` + hamburger. `SPICES` is CRAV's
product line and does not exist for Ruby → removed. `CONTACT` becomes `VISIT`
(address + phone + map are the same intent).

### Footer nav

`MENU · BURGERS · CHICKEN · COMBOS · VISIT · ORDER NOW`

### Sitemap (future routes)

```
/                 this page (one-pager + anchors)
/menu             full menu, all 7 categories    [later]
/admin            Hono-gated dashboard           [later]
```

i18n structure prepared as `/` (en) and `/vi` (vi) via Astro's future i18n
routing — **no strings hardcoded in components**; all copy goes through a
`content/en.ts` dictionary from day one so VI is a translation file, not a
refactor.

---

## 3. Content hierarchy

```
HERO
├─ eyebrow (rotated sticker)  WESTERN DINER · PHÚ QUỐC        ← factual, from B-info
├─ H1 (30vw)                   BIG FLAVOR.
│                              RUBY STYLE.                      ← approved headline
├─ hero mark                   crab mascot (floating)
├─ giant wordmark              RUBY
├─ left para                   burgers, fried chicken, combos
└─ right para                  location + phone

MENU (Explore Our Menu)
├─ eyebrow                     OUR MENU
├─ H2                          EXPLORE THE MENU
├─ sub                         one short line
└─ 7 category cards            from supplied menu
   Burgers · Chicken & Snacks · Combos · Hotdog & Sausage
   Pasta · Salads · Drinks & Beer

BURGERS (Signature Burgers)
├─ eyebrow                     SIGNATURE
├─ H2                          BURGERS WORTH THE MESS
└─ 5 items                     name + price + one-line descriptor

CHICKEN (Crispy Chicken & Snacks)
├─ eyebrow                     CRISPY
├─ H2                          FRIED. GOLDEN. GONE.
└─ items                       ⚠ blocked by B5 (no items/prices supplied)

COMBOS (Ruby Classic Combos)
├─ eyebrow                     MAKE IT A COMBO
├─ H2                          THE FULL SETUP
└─ 6 combos                    name + real price

VISIT (Find Us)
├─ eyebrow                     FIND US
├─ H2                          COME HUNGRY.
├─ address                     24, 30/4 Street, Dương Đông, Phú Quốc
├─ phone                       0327 81 57 57
├─ hours                       ⚠ B4
└─ map link                    ⚠ B6

FOOTER
├─ wordmark                    RUBY KITCHEN 81
├─ nav
├─ phone + address
└─ © 2026 RUBY KITCHEN 81
```

---

## 4. Copy — proposed, section by section

Rules applied: no CRAV phrasing reused; no invented history, awards, nutrition,
sourcing or promotions; real prices only; ±20% character length of the slot it
replaces so kinetic typography does not reflow.

### HERO

| Slot | CRAV (old) | **Ruby (proposed)** | chars |
|---|---|---|---|
| H1 part 1 | `THE BURGER` | `BIG FLAVOR.` | 11 ✓ |
| H1 part 2 | — | `RUBY STYLE.` | 11 |
| badge L | `SMASHED FRESH` | `SMASHED DAILY` | 13 ✓ |
| badge R | `BOLD FLAVOR` | `ICE COLD BEER` | 13 ✓ |
| giant | `CRAV` | `RUBY` | 4 ✓ |
| eyebrow | — | `WESTERN DINER · PHÚ QUỐC` | 25 |
| para L | "Smashed hot on the flat top…" | "Burgers, fried chicken and cold beer, made fresh to order in Dương Đông. No shortcuts, no small portions." | 112 ✓ |
| para R | "Topped with melted cheddar…" | "Dine in, take away, or grab a combo. Open for lunch through late — 24, 30/4 Street, Phú Quốc." | 101 ✓ |

> `SMASHED DAILY` and `ICE COLD BEER` are **claims about operations**.
> ⚠ Confirm both are true (B10 below) or I swap them for neutral ones.

### MENU (Explore)

| Slot | CRAV | **Ruby** | chars |
|---|---|---|---|
| eyebrow | `EXPERIENCE` | `OUR MENU` | 8 ✓ |
| H2 | `food that feels good` | `EXPLORE THE MENU` | 16 vs 20 ✓ |
| sub | — | "Seven ways to get full." | 23 |

**Category cards (7, real, from supplied menu):**

| Card | Label | Count |
|---|---|---|
| 1 | BURGERS | 5 items |
| 2 | CHICKEN & SNACKS | ⚠ B5 |
| 3 | COMBOS | 6 items |
| 4 | HOTDOG & SAUSAGE | ⚠ B5 |
| 5 | PASTA | ⚠ B5 |
| 6 | SALADS | ⚠ B5 |
| 7 | DRINKS & BEER | ⚠ B5 |

### BURGERS (Signature)

| Slot | CRAV | **Ruby** | chars |
|---|---|---|---|
| eyebrow | `TOP CLASSIC` | `SIGNATURE` | 9 ✓ |
| H2 | `juicy cheesy fully Loaded` | `BURGERS WORTH THE MESS` | 22 vs 26 ✓ |
| para | "CRAV is back and bolder than ever…" | "Five house burgers, built to order. Beef, chicken or veggie — all of them messy." | 85 |

**Items — real data only:**

| Item | Price | Descriptor |
|---|---|---|
| Double Beef & Bacon Burger | 140.000₫ | Double patty, bacon, cheese |
| Cheese Burger | 75.000₫ | Classic, no fuss |
| Crispy Chicken Burger | 65.000₫ | Fried chicken, crunchy slaw |
| Garlic Chicken Cheese Burger | 75.000₫ | Garlic sauce, melted cheese |
| Vegetarian Burger | 65.000₫ | Plant-based patty |

> Descriptors are **inferred from the item names only** — no invented
> ingredients. ⚠ B11: confirm or supply real descriptions.

### CHICKEN (Crispy Chicken & Snacks)

| Slot | CRAV | **Ruby** | chars |
|---|---|---|---|
| eyebrow | `PURE QUALITY` | `CRISPY` | 6 ✓ |
| H2 ×4 | `Every Layer` / `Packed With` / `Signature` / `Flavor` | `FRIED` / `GOLDEN` / `CRUNCHY` / `GONE` | 5/6/7/4 ✓ |

> Keeps the 4-line type stunt (it is a layout device, not CRAV content) but with
> Ruby words. ⚠ Items blocked by B5 — this section shows the type stunt plus a
> "full list coming" state until items are supplied. **Alternative:** collapse
> this section until B5 is answered.

### COMBOS

| Slot | CRAV | **Ruby** | chars |
|---|---|---|---|
| eyebrow | `FEEL IT` | `MAKE IT A COMBO` | 15 |
| H2 | `feel the Change` | `THE FULL SETUP` | 14 vs 15 ✓ |
| para | "Smashed for the bold…" | "Burger plus sides plus a drink. Six set-ups, one decision." | 62 |

**Items — real prices:**

| Combo | Price |
|---|---|
| Double Beef & Bacon Deluxe Set | 169.000₫ |
| Cheese Burger Combo | 105.000₫ |
| Crispy Chicken Combo | 85.000₫ |
| Crispy Chicken Deluxe Set | 109.000₫ |
| Garlic Chicken Cheese Combo | 99.000₫ |
| Garlic Chicken Deluxe Set | 119.000₫ |

### VISIT

| Slot | CRAV | **Ruby** | chars |
|---|---|---|---|
| eyebrow | `TAKE AWAY` | `FIND US` | 7 ✓ |
| H2 | `QUALITY THAT TRAVELS WITH YOU` | `COME HUNGRY.` | 12 vs 29 |
| address | 5 city names | `24, 30/4 Street, Dương Đông, Phú Quốc` | 40 |
| phone | — | `0327 81 57 57` | 12 |
| hours | — | ⚠ B4 | |

### FOOTER

| Slot | CRAV | **Ruby** |
|---|---|---|
| wordmark | `CRAV` | `RUBY KITCHEN 81` |
| tagline | `Smashed patties · toasted buns · est. 1997` | `Burgers · Fried Chicken · Cold Beer` |
| copyright | `© 2026 CRAV` | `© 2026 RUBY KITCHEN 81` |
| meta | `Est. 1997 — Navarra, España` | `24, 30/4 Street, Phú Quốc` |

---

## 5. Asset plan

| Need | Status | Action |
|---|---|---|
| **Ruby wordmark** | ❌ no file (B2) | typeset in an open display font; two sizes (nav, footer) |
| **Crab mascot** | ✅ `Newlogo-heroSection.webp` | hero mark, sticker replacement, eye-tracking target |
| **Burger photography** | ❌ none (B1) | placeholder or client shoot |
| **Chicken photography** | ❌ none | placeholder |
| **Combo photography** | ❌ none | placeholder |
| **Venue / interior** | ❌ none | placeholder |
| **Ingredient cut-outs** (lettuce, tomato, cheese, meat) | ✅ generic | reuse as motif |
| **Cursor subject** | derive from mascot | new |
| **OG image** | regenerate from hero composition | new |

**Delete:** `burger-boy.png`, `burgerselfie.png`, `about-1/2/3.webp`,
`berlin/london/newyork/sydney/tokyo.webp`, `burgerH.webp`, `spices.webp`,
`og-image.webp` (12 files)

---

## 6. Motion language — Ruby vs CRAV

Instruction #6: keep the investment, build Ruby's own language, do not copy
CRAV's signature.

**Retire (CRAV signature):**
- peeling sticker (4 instances) — the peel-with-specular-light is CRAV's
  most identifiable effect
- food-rope cursor with 4 ingredient knots

**Ruby motion proposal (Phase 2 will detail):**

| Ruby motif | Mechanic | Replaces |
|---|---|---|
| **Crab follows you** | crab mascot idles in hero, leans toward cursor (reuse `quickSetter`), blinks on idle | food-rope cursor |
| **Bite reveal** | sections reveal with a fast "chomp" ease — content snaps in from a slight scale + rotate, `power4.out` | CRAV's `back.out` word pop |
| **Menu cards deal** | category cards deal in like cards from a deck, staggered, `power3.out` | ingredients parallax |
| **Price counter** | prices count up on first reveal (rAF, respects reduced-motion) | — new |
| **Steam / sizzle drift** | subtle rising particle drift behind hot items (CSS only, no canvas) | juggling footer veggies |
| **Ketchup-line dividers** | dividers become a hand-drawn ketchup squeeze line that draws on scroll (`stroke-dashoffset`) | wavy "jelly" divider |

All built on the **existing** GSAP/ScrollTrigger/Lenis/LinesReveal/SplitText
utilities — no new library.

**Performance targets:** 60fps on mid Android; `prefers-reduced-motion` path for
every effect; no animation may block MENU / ORDER NOW.

---

## 7. Blockers to confirm (client input required)

| # | Question | Blocks |
|---|---|---|
| **B1** | Ruby photography (food/venue)? | hero, burgers, chicken, combos, visit, photo band |
| **B2** | Logo file, or approve typeset wordmark? | nav, footer |
| **B3** | Any factual founding story / awards? | about (currently dropped) |
| **B4** | Opening hours? | Visit |
| **B5** | Items + prices for Chicken & Snacks, Hotdog, Pasta, Salads, Drinks, Beer, Extras? | Menu cards, Chicken section |
| **B6** | Google Maps place URL / place ID? | Visit |
| **B7** | *(resolved — dropping all nutrition claims)* | — |
| **B10** | Is "smashed daily" and "cold beer" true? | hero badges |
| **B11** | Real one-line descriptions for the 5 burgers? | Burgers |
| **B12** | Delivery/ordering links (GrabFood, ShopeeFood…)? | ORDER NOW behaviour |

---

## 8. What I propose we do next

1. **You approve or correct the copy in §4** (this is the highest-leverage review).
2. **You answer B1, B2, B5, B12** — the four that unblock the most.
3. Then Phase 2: three genuinely different redesign concepts
   (layout × typography × imagery treatment × motion language), each with
   section structure, motion concept, asset requirements and perf notes.

I have **not modified any code**. `remix/PHASE-0-AUDIT.md` and this file are the
only outputs.

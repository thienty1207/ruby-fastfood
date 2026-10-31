# REMIX — INDEX

Ruby Kitchen 81 rebrand, from the CRAV clone.

**Status: blueprint only. No code has been modified.**
`git status` shows only this `remix/` folder as new; `git diff HEAD` is empty.

## The 4 phases (all written, in review order)

| # | File | What it gives you | Pages |
|---|---|---|---|
| **0** | [PHASE-0-AUDIT.md](./PHASE-0-AUDIT.md) | Technical audit: 25 assets catalogued, 33 hardcoded colours, 14 effects classified (3 are CRAV signature → retire, 11 reusable), 21/21 copy strings to rewrite, 9 blockers | ~11 KB |
| **1** | [PHASE-1-CONTENT-MAP.md](./PHASE-1-CONTENT-MAP.md) | CRAV→Ruby section mapping (11→8 blocks), nav/sitemap, content hierarchy, and **proposed copy for every section** with character counts | ~13 KB |
| **2** | [PHASE-2-CONCEPTS.md](./PHASE-2-CONCEPTS.md) | Three genuinely different redesigns: **A Diner Sign** / **B Checkerboard** / **C Neon Grid** — each with palette, type, hero, section order, motion language, assets, mobile, performance | ~10 KB |
| **3** | [PHASE-3-TWEAK-PANEL.md](./PHASE-3-TWEAK-PANEL.md) | The live tweak panel: 14 named knobs with types/ranges, `panel.json`, permalink state, verification checklist | ~8 KB |

**No Phase 4.** After Phase 3 the site is deliverable.

## Read in this order

```
0 → what we have and what it costs to change it
1 → what the site will say            ← review the copy first, it is the long pole
2 → what the site will look like      ← pick A, B or C
3 → how you tune it afterwards        ← read once, decide later
```

## The one-paragraph version

The codebase is a good engine with CRAV's paint job, CRAV's words and CRAV's
characters. 11 of 14 motion effects are reusable utilities; 3 are CRAV's
signature and get retired. Every one of the 21 copy strings must be rewritten.
The page shrinks from 11 blocks / 10,429px to 8 blocks / ~6,000px so the menu is
reachable in ~3 swipes. Three redesign concepts are proposed; none of them can
be fully built until real Ruby photography exists.

## Blockers (need your answers)

| # | Question | Blocks |
|---|---|---|
| **B1** | Ruby photography — food, venue? | 9 assets |
| **B2** | Logo file, or approve typeset wordmark? | nav, footer |
| **B5** | Items + prices for Chicken/Hotdog/Pasta/Salads/Drinks/Beer? | 5 of 7 menu cards |
| **B10** | Are "smashed daily" and "ice cold beer" true? | 2 hero badges |
| **B12** | Order link (GrabFood / ShopeeFood / phone)? | ORDER NOW button |

Fully answered already: brand name, positioning, address, phone, burger menu +
combo prices with real VND figures, palette, mascot, copy voice.

## What was NOT invented

Per your instruction #2, nothing here fabricates:

- no founding date, history or heritage (CRAV's "est. 1997 / Navarra España" is
  explicitly flagged for removal)
- no nutrition or kcal claims (CRAV's "450 kcal / High Protein" is flagged as
  unverified and dropped)
- no awards, certifications, sourcing claims
- **no menu item, price, or promotion** beyond the list you supplied
- burger descriptors are marked `inferred from item name` for you to confirm

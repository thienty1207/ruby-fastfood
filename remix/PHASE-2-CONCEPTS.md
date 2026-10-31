# PHASE 2 — THREE REDESIGN CONCEPTS

**Amplitude:** BIG (requested) — each concept changes hero treatment, layout,
section order and motion language, not just palette.
**Rule applied:** every concept differs from the others on **≥3 forks**
(palette mood × type pairing × hero treatment × density × motion personality ×
surface).

**Common to all three** (so the comparison is fair):

- Real menu data + real prices only (from Phase 1).
- Crab mascot `Newlogo-heroSection.webp` as the one supplied brand asset.
- English copy from Phase 1 §4, ±20% length.
- Built on the existing GSAP 3.15 / ScrollTrigger / Lenis / SplitText stack.
- `prefers-reduced-motion` path for every effect.
- No CRAV signature effects: sticker peel and food-rope cursor are retired in
  all three.
- Wordmark `RUBY KITCHEN 81` typeset (blocker B2) — no invented logo.

---

# CONCEPT A — "DINER SIGN"

> *Neon roadside diner at night. The page is a lit sign, not a brochure.*

| Fork | Position |
|---|---|
| Palette mood | **dark, high-contrast, saturated accent** — charcoal `#151515`, flame `#F47735`, ruby `#951E2A`, cream `#F5EBDD` |
| Type pairing | **condensed grotesk display + humanist sans body** (e.g. Archivo Narrow / Barlow Condensed + Inter) — signage lettering |
| Hero treatment | **pure type + mascot**: giant `BIG FLAVOR.` overtyped with `RUBY STYLE.`, crab perched on the baseline |
| Density | **compact** — tight tracking, `×0.85` vertical rhythm |
| Motion | **cinematic** — slow 1.1s reveals, big 60px travel, letter-spacing cinematics |
| Surface | **flat + neon glow** — no shadows, accent-colored `box-shadow` glow on CTAs |

### Section structure

```
1  Nav             thin, single line, always visible (no hide-on-scroll)
2  HERO            type-only, 3 stacked lines, crab on baseline
                   BIG FLAVOR.
                   RUBY
                   STYLE.
3  TICKER          marquee: BURGERS · FRIED CHICKEN · COLD BEER · PHÚ QUỐC
4  MENU            7 category rows (list, not cards) — full width, hover expands
5  BURGERS         horizontal scroll-jacked rail, 5 items
6  COMBOS          price table, monospace numerals
7  VISIT           address block, big, left-aligned, map link
8  FOOTER          sign-off: wordmark + phone
```

### Motion concept

- **Sign flicker on load**: hero lines come on like a neon tube — opacity 0→1
  in 3 uneven steps (`0.06s`, `0.02s`, `0.4s` gaps), no easing. Reads as a sign
  warming up.
- **Letter-spacing cinematics**: on hero scroll-out, `letter-spacing` grows
  `0 → 0.08em` while opacity drops — the sign receding.
- **Ticker**: CSS `translateX` marquee, pause on hover.
- **Menu rows**: on scroll, each row's rule line draws L→R (`scaleX`), price
  counts up.
- **Rail**: ScrollTrigger pin + horizontal `x` scrub for the burgers rail.

### Asset requirements

| Asset | Need | Status |
|---|---|---|
| Crab mascot | hero, ticker end-cap | ✅ have |
| Burger photos ×5 | rail | ❌ **B1** |
| Neon texture | optional glow overlay | can be CSS-only |

### Desktop / mobile

- Desktop: 3-line hero fills viewport at 1440; rail is scroll-jacked.
- Mobile: hero becomes 5 lines at `22vw`; rail becomes a native horizontal
  swipe (no ScrollTrigger pin — pinning fights mobile scroll).

### Performance

- Lowest risk of the three: pure type + CSS marquee + one pinned rail.
- Scroll-jack is the only expensive piece; disabled under `reduced-motion`.

---

# CONCEPT B — "CHECKERBOARD"

> *Paper menu on a red-and-black checked tablecloth. Warm, tactile, retro.*

| Fork | Position |
|---|---|
| Palette mood | **light / warm cream base with saturated red blocks** — cream `#F5EBDD` page, ruby `#951E2A` panels, charcoal text |
| Type pairing | **slab serif display + grotesk body** (e.g. Roboto Slab / Zilla Slab + Inter) — diner menu lettering |
| Hero treatment | **product-led collage**: crab + burger cut-out + a paper menu card, layered with rotated sticker frames |
| Density | **airy** — `×1.25` spacing, generous margins |
| Motion | **springy** — 0.5s reveals with `back.out(2.2)`, tight 0.06 stagger |
| Surface | **bordered + elevated** — 2px charcoal borders, hard offset shadows (`4px 4px 0`) |

### Section structure

```
1  Nav             paper strip with a serrated bottom edge
2  HERO            collage: 3 layered objects + headline on a menu card
                   BIG FLAVOR.
                   RUBY STYLE.
3  MENU            7 rectangular cards in a 4/3 grid, checkerboard accents
4  BURGERS         5 items as paper menu entries with dotted price leaders
5  CHICKEN         3-up photo tiles with corner stickers
6  COMBOS          6 combos as a two-column paper list
7  VISIT           address on a "receipt" card, torn bottom edge
8  FOOTER          cream, wordmark + phone + address
```

### Motion concept

- **Paper deal**: on section entry, cards rotate in from `±8deg` with
  `back.out`, like being dealt onto the table.
- **Dotted leaders**: burger rows draw their `. . . .` leader via
  `background-size` animation on scroll.
- **Checkerboard wipes**: section transitions use a CSS conic-gradient
  checkerboard that scales in behind the content.
- **Crab hop**: mascot does a small `y` hop on click anywhere in the hero
  (playful, one-time per session).

### Asset requirements

| Asset | Need | Status |
|---|---|---|
| Crab mascot | hero collage, hop interaction | ✅ have |
| Burger cut-outs ×5 | card imagery | ❌ **B1** |
| Chicken cut-outs | tiles | ❌ **B1** |
| Checkerboard texture | background | generate with CSS (no file) |
| Paper grain | subtle texture | generate with CSS `feTurbulence` |

### Desktop / mobile

- Desktop: 4-column card grid; hero collage spreads wide.
- Mobile: cards go 1-up full width; collage collapses to crab + headline only
  (burger cut-outs hidden to protect LCP).

### Performance

- Medium risk: many layered images + `backdrop-filter` avoidance is important.
  No blur filters; shadows are hard offsets (cheap).
- Paper grain via SVG filter is static (not animated) → one-time cost.

---

# CONCEPT C — "NEON GRID"

> *Late-night arcade menu board. Big numerals, grid lines, high energy.*

| Fork | Position |
|---|---|
| Palette mood | **near-black + electric accent pair** — `#0A0A0A` base, flame `#F47735` primary, ruby `#951E2A` secondary, cream text |
| Type pairing | **wide grotesk + monospace numerals** (e.g. Space Grotesk + JetBrains Mono) — scoreboard feel |
| Hero treatment | **type + grid overlay + mascot**: headline in a ruled grid; crab as a sprite in the corner with an idle bob |
| Density | **compact grid** — everything snaps to a 12-col rule |
| Motion | **snappy** — 0.35s reveals, `power4.out`, no overshoot, 0.04 stagger |
| Surface | **hairline rules** — 1px cream/12% grid lines, no fills, no shadows |

### Section structure

```
1  Nav             grid row with cell borders
2  HERO            headline snapped to grid cells + crab sprite
                   BIG FLAVOR.
                   RUBY STYLE.
3  MENU            7-cell grid, each cell numbered 01–07
4  BURGERS         5 rows: 01 · name · price · rule
5  CHICKEN        (merged into menu category 02 until B5 answered)
6  COMBOS          6 rows with running totals styling
7  VISIT           grid block: ADDRESS / PHONE / HOURS(B4) / MAP
8  FOOTER          grid row, mono meta
```

### Motion concept

- **Grid draw**: the page's grid lines draw in on load (`scaleY`/`scaleX` from
  0), 0.35s stagger — the board assembling.
- **Number tick**: every price and section number ticks up from 00 on reveal
  (rAF, lasts 0.4s, respects reduced-motion).
- **Crab sprite bob**: 2px `y` idle loop, pauses when hero leaves viewport.
- **Snap reveal**: content snaps into grid cells with `clip-path` inset
  `0 100% 0 0 → 0`, giving a "flipboard" feel — no fade.

### Asset requirements

| Asset | Need | Status |
|---|---|---|
| Crab mascot | sprite, bob | ✅ have |
| Burger photos | optional — rows work with rules only | 🟡 **not blocking** |
| Grid/rule system | CSS only | ✅ |

### Desktop / mobile

- Desktop: 12-col rule grid, generous line-height.
- Mobile: 4-col, rules collapse to horizontal dividers; numbers stay.
- **This concept is the least dependent on photography** — a real advantage
  while B1 is open.

### Performance

- Lowest asset cost, highest text cost. Font subsetting matters.
- `clip-path` reveals are GPU-composited, cheap.
- No images above the fold → excellent LCP.

---

## Comparison

| | A — Diner Sign | B — Checkerboard | C — Neon Grid |
|---|---|---|---|
| Palette | dark + glow | light + red blocks | near-black + hairlines |
| Type | condensed grotesk | slab serif | wide grotesk + mono |
| Hero | pure type + mascot | collage + mascot | type + grid + mascot |
| Density | compact | airy | compact grid |
| Motion | cinematic / flicker | springy / deal | snappy / snap |
| Surface | flat + glow | bordered + offset shadow | hairline rules |
| **Needs photos?** | yes (rail) | **yes, most** | **no — works without** |
| Risk if B1 unanswered | medium | **high** | **low** |
| Est. height @1440 | ~6,200px | ~7,400px | ~6,000px |

**My recommendation:** **C** while photography is outstanding — it ships a real,
finished site with zero placeholder imagery, and it is the fastest of the three.
If B1 is resolved, **A** is the strongest "diner at night" identity and the most
different from CRAV. **B** is the warmest but depends entirely on product shots.

**None of the three can be built before B1/B2/B5 are answered** beyond skeleton
level — that is stated plainly rather than hidden.

---

## Implementation plan (same for whichever is picked)

| Step | Work | Verify |
|---|---|---|
| 1 | Phase 0 cleanup: tokenize 33 hex, delete 12 CRAV assets, `--rx-*` role layer | `docH` unchanged, motion unchanged |
| 2 | `content/en.ts` dictionary — every string, no inline copy | build passes, no literal copy in components |
| 3 | Rebuild section shells for the chosen concept | per-section screenshot |
| 4 | Apply concept's motion language (retire the 2 CRAV signature effects) | each effect measured mid-flight |
| 5 | `prefers-reduced-motion` audit | every animation has a static path |
| 6 | Mobile + perf pass | Lighthouse mobile ≥ 85, no CLS |
| 7 | New regression baseline (old 10429 is CRAV's layout — it will change) | new numbers recorded |

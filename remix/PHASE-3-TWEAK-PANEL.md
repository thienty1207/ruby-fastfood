# PHASE 3 — TWEAK PANEL (live knobs)

Built **only on the direction you pick in Phase 2**. Purpose: after the concept
is chosen, you can tune the real decisions live instead of asking for another
revision round.

**Included knob test:** *would you change this twice in the next hour?*
Accent — yes. The 7th spacing step — no.

---

## How it works (technical)

1. **Only works on variables.** Phase 3 cannot exist until Phase 0 has moved the
   decisions into custom properties. That is why Phase 0 tokenization is not
   optional.
2. Every decision in the chosen concept becomes a `--p-*` property declared in
   the direction's patch block, e.g.
   ```css
   :root[data-rx="neon-grid"] {
     --p-accent: #F47735;
     --p-rule-alpha: 0.12;
     --p-display-size: 15vw;
   }
   .rx-rule { border-color: color-mix(in oklab, var(--p-cream) calc(var(--p-rule-alpha) * 100%), transparent); }
   ```
3. Panel writes `--p-*` on `:root` live. Motion knobs write into
   `window.__remix.motion` and dispatch `rx:change`; behaviours must read params
   at call time, not cache them at import.
4. State serialises into the URL hash `#rx=…` → a link is a permalink.
5. **Dev-only** — stripped from the production build (`grep rx-panel dist/` must
   return nothing).

---

## The 14 knobs (per chosen direction)

Grouped exactly as the panel renders them. Defaults shown are for **Concept C —
Neon Grid**; A and B get the same knob set with their own defaults.

### Color

| # | id | Label | Type | Default | Range |
|---|---|---|---|---|---|
| 1 | `--p-bg` | Page background | color | `#0A0A0A` | — |
| 2 | `--p-accent` | Flame accent | color | `#F47735` | — |
| 3 | `--p-accent-2` | Ruby accent | color | `#951E2A` | — |
| 4 | `--p-cream` | Text / cream | color | `#F5EBDD` | — |
| 5 | `--p-rule-alpha` | Grid line strength | number | `0.12` | 0 – 0.5, step .01 |

### Type

| # | id | Label | Type | Default | Range |
|---|---|---|---|---|---|
| 6 | `--p-display-font` | Display font | select | `Space Grotesk` | Space Grotesk / Archivo Narrow / Roboto Slab / Modak |
| 7 | `--p-display-size` | Hero size | length | `15vw` | 9 – 24 vw, step 0.5 |
| 8 | `--p-display-tracking` | Display tracking | length | `-0.02em` | −0.08 – 0.04 em, step 0.005 |
| 9 | `--p-body-size` | Body size | length | `1.8vw` | 1.2 – 2.6 vw, step 0.1 |

### Space

| # | id | Label | Type | Default | Range |
|---|---|---|---|---|---|
| 10 | `--p-section-gap` | Section rhythm | number | `1` (×) | 0.7 – 1.5, step 0.05 |
| 11 | `--p-content-max` | Content max-width | length | `100vw` | 60 – 100 vw, step 1 |

### Motion

| # | id | Label | Type | Default | Range |
|---|---|---|---|---|---|
| 12 | `motion.reveal.duration` | Reveal duration | number | `0.35` | 0.1 – 1.2 s, step 0.05 |
| 13 | `motion.stagger` | Stagger | number | `0.04` | 0 – 0.2 s, step 0.005 |

### Mascot

| # | id | Label | Type | Default | Range |
|---|---|---|---|---|---|
| 14 | `motion.mascot.bob` | Crab idle bob | number | `2` | 0 – 8 px, step 1 |

**Deliberately not included:** radius, shadows, 60+ spacing steps, per-section
colours. They would be touched once, not twice — they belong in the direction
file, not the panel.

---

## panel.json (Concept C shown)

```json
{
  "title": "Neon Grid",
  "slug": "neon-grid",
  "presets": {
    "as picked": {},
    "warmer":   { "--p-accent": "#F4A259", "--p-accent-2": "#951E2A" },
    "rougher":  { "--p-rule-alpha": 0.28, "--p-display-tracking": "0.01em" }
  },
  "knobs": [
    { "id": "--p-bg",              "label": "Page background",   "group": "Color",  "type": "color",  "default": "#0A0A0A" },
    { "id": "--p-accent",          "label": "Flame accent",      "group": "Color",  "type": "color",  "default": "#F47735" },
    { "id": "--p-accent-2",        "label": "Ruby accent",       "group": "Color",  "type": "color",  "default": "#951E2A" },
    { "id": "--p-cream",           "label": "Text / cream",      "group": "Color",  "type": "color",  "default": "#F5EBDD" },
    { "id": "--p-rule-alpha",      "label": "Grid line strength", "group": "Color", "type": "number", "default": 0.12, "min": 0, "max": 0.5, "step": 0.01 },
    { "id": "--p-display-font",    "label": "Display font",      "group": "Type",   "type": "select", "options": ["Space Grotesk","Archivo Narrow","Roboto Slab","Modak"], "default": "Space Grotesk" },
    { "id": "--p-display-size",    "label": "Hero size",         "group": "Type",   "type": "length", "default": "15vw", "min": 9, "max": 24, "step": 0.5, "unit": "vw" },
    { "id": "--p-display-tracking","label": "Display tracking",  "group": "Type",   "type": "length", "default": "-0.02em", "min": -0.08, "max": 0.04, "step": 0.005, "unit": "em" },
    { "id": "--p-body-size",       "label": "Body size",         "group": "Type",   "type": "length", "default": "1.8vw", "min": 1.2, "max": 2.6, "step": 0.1, "unit": "vw" },
    { "id": "--p-section-gap",     "label": "Section rhythm",    "group": "Space",  "type": "number", "default": 1, "min": 0.7, "max": 1.5, "step": 0.05 },
    { "id": "--p-content-max",     "label": "Content max-width", "group": "Space",  "type": "length", "default": "100vw", "min": 60, "max": 100, "step": 1, "unit": "vw" },
    { "id": "motion.reveal.duration","label": "Reveal duration", "group": "Motion", "type": "number", "default": 0.35, "min": 0.1, "max": 1.2, "step": 0.05 },
    { "id": "motion.stagger",      "label": "Stagger",           "group": "Motion", "type": "number", "default": 0.04, "min": 0, "max": 0.2, "step": 0.005 },
    { "id": "motion.mascot.bob",   "label": "Crab idle bob",     "group": "Mascot", "type": "number", "default": 2, "min": 0, "max": 8, "step": 1 }
  ]
}
```

---

## Panel behaviour

| Feature | Detail |
|---|---|
| Toggle | key `` ` `` |
| Position | fixed right, collapsible, resize grip |
| Groups | Color / Type / Space / Motion / Mascot — each collapsible |
| Per knob | right-click = reset, double-click value = type it |
| Presets | "as picked" · "warmer" · "rougher" |
| Permalink | state → `#rx=…`; copy link button |
| Export | **Copy JSON** → pastes as a new `remix/directions/<slug>.json` |
| Reset all | returns to the direction's defaults |
| Production | not mounted (`import.meta.env.DEV` only) |

---

## Verification checklist (before I report Phase 3 done)

1. Every one of the 14 knobs visibly changes the page — screenshot the two
   extremes for at least 3 knobs.
2. Permalink round-trips: copy link → fresh tab → identical state.
3. **Reset** returns to exactly the direction defaults (0% pixel diff vs
   `?rx=<slug>`).
4. **Copy JSON** output is accepted by `apply-overrides.js` as a new direction.
5. `grep -r "rx-panel" dist/` returns nothing.
6. Panel does not steal focus or block scrolling (Lenis must not fight it).

---

## Summary of all 4 phases

| Phase | Output | Blocks what |
|---|---|---|
| **0** Audit | `PHASE-0-AUDIT.md` | — (done) |
| **1** Content map | `PHASE-1-CONTENT-MAP.md` | needs B1/B2/B5/B12 answers |
| **2** Concepts | `PHASE-2-CONCEPTS.md` | needs your pick of A/B/C |
| **3** Panel | this file | needs Phase 2 pick + Phase 0 tokenization |

**There is no Phase 4.** After Phase 3 the site is deliverable: chosen concept,
live-tunable, production-stripped panel, new regression baseline recorded.

### What I need from you, in order

1. Approve/correct the **copy** in Phase 1 §4.
2. Answer **B1** (photos), **B2** (logo), **B5** (missing menu items),
   **B12** (order link).
3. Pick a **concept** A / B / C.
4. Confirm **"smashed daily"** and **"ice cold beer"** are true (B10).

Then I implement: Phase 0 cleanup → content dictionary → concept build →
motion → panel → new baseline.

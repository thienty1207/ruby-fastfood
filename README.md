# Ruby Fastfood — monorepo

Astro client/admin + Hono API on Bun. **Skeleton stage:** structure and config
only — the CRAV clone source still lives in `output/www.cravburgers.shop/site/`
and is migrated into `frontend/client/` in the next step.

## Structure

```
ruby-fastfood/
├── frontend/
│   ├── client/            @ruby/client   Astro 7 + GSAP + Lenis
│   └── admin/             @ruby/admin    Astro 7 + TypeScript
├── backend/               @ruby/backend  Hono 4 + Bun + SQLite + Drizzle
├── packages/
│   └── shared/            @ruby/shared   types + valibot schemas
├── tools/qa/              regression harness
├── _research/             clone artifacts (archive)
├── output/                pre-restructure snapshot (to be removed later)
├── bunfig.toml
├── tsconfig.base.json
└── .env.example
```

## Requirements

- **Bun ≥ 1.3** (tested on 1.4.4)
- No Node.js needed.

## Install

```bash
bun install
```

Bun uses an isolated store (`node_modules/.bun`), so each workspace gets its own
linked `node_modules` — do not expect a flat hoisted tree.

## Dev

```bash
bun run dev:client    # Astro  → http://localhost:4321
bun run dev:admin     # Astro  → http://localhost:4322
bun run dev:api       # Hono   → http://localhost:3000
bun run dev:all       # all three in parallel
```

## Build

```bash
bun run build            # client + admin
bun run typecheck        # all workspaces
```

Build outputs land in `frontend/*/dist/`. Hono serves them in production; CI
copies them into the deploy target.

## Verify the skeleton

```bash
curl localhost:3000/api/health          # → {"ok":true,...}
curl localhost:3000/admin/api/me        # → 401 (auth gate works)
curl localhost:3000/nope                # → 404
```

## Environment

```bash
cp .env.example .env      # then fill in values
```

Never commit `.env`. It is gitignored along with `*.db`, `dist/`, `node_modules/`.

## Security notes

- `bunfig.toml` sets `exact = true` for **reproducible installs** — that is not
  the same as "safe". Run `bun audit` and keep `bun.lock` committed.
- Auth lives in Hono only. The frontend apps are static and hold no secrets.

## Critical constraint (read before touching CSS)

`frontend/client/src/styles/site.css` is the original site's own compiled
stylesheet. It defines `md:` as **`min-width: 1025px`**, not Tailwind's 768px
default.

**Do not add Tailwind, PostCSS plugins, or autoprefixer to the client.** Any
transformer that normalizes that breakpoint breaks the clone's footer by 45–88px
and voids the regression baseline (`docH 10429`).

## Regression baseline

After any change to the client, the clone must still measure:

| Viewport | document height | section deltas |
|---|---|---|
| 1440 | **10429** | 0 |
| 768 | **14634** | 0 |
| 390 | **7790** | 0 |

```bash
bun run --cwd frontend/client build
bun run --cwd frontend/client serve-dist.mjs   # in another shell
bun run qa:stable
```

If a number moves, stop and fix before continuing.

## Status

| Component | State |
|---|---|
| Bun workspaces | ✅ installing, linking, resolving |
| `@ruby/shared` | ✅ types + valibot schemas, imported by client |
| `frontend/client` | ✅ **clone migrated to Astro — verified delta 0 at all 3 viewports** |
| `frontend/admin` | 🟡 Astro MPA shell builds; pages not built yet |
| `backend` | 🟡 Hono runs, `/api/health` OK, auth gate OK; no DB yet |
| `tools/qa` | ✅ `stable.mjs` byte-identical to the original harness |
| `_research` | ✅ teardown, probes, 33 recon scripts archived |

### What the migration preserved

The `.astro` section components render the **same markup functions** the clone
used (`set:html`), so the emitted HTML is byte-identical to the pre-migration
build. `src/scripts/main.ts` now only runs `init()` in the original order:
`lenis → dividers → chrome → sections → stickers → refresh`.

No GSAP/Lenis logic was rewritten, and `site.css` is byte-identical
(67051 bytes, unchanged in the migration commit).


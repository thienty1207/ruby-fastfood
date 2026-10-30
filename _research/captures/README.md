# CRAV clone — how to run

Verified with **Bun 1.4.3**. pnpm and npm also work.

## Quick start (from this folder)

```bash
bun install
bun run dev
```

Open the URL it prints — normally <http://localhost:5273>.
`127.0.0.1:5273` works too.

```bash
bun run build       # production bundle -> site/dist
bun run typecheck   # tsc --noEmit
bun run preview     # serve the production build
```

## Or run from inside the app folder

```bash
cd site
bun install
bun run dev
```

Both entry points work: the root `package.json` forwards to `site/` via
`bun --cwd=site run …`.

## With pnpm

```bash
bun install        # or: pnpm install
pnpm dev
pnpm build
```

Both lockfiles ship (`bun.lock`, `pnpm-lock.yaml`) and both produce the same
bundle hash.

## Requirements

- Bun ≥ 1.1 (tested on 1.4.3) **or** Node ≥ 20 with pnpm/npm
- No other system dependencies — fonts and images are vendored in `site/public/`

## What's in this folder

| Path | What |
|---|---|
| `site/` | **the clone** — Vite + TypeScript app |
| `site/src/sections/` | one module per page section |
| `site/src/components/` | cursor, nav, sticker, divider, split-text |
| `site/src/styles/site.css` | the site's own 67 KB compiled stylesheet |
| `site/public/img-webp/`, `site/public/img/` | real assets downloaded from origin |
| `site/public/fonts/` | Modak + Mouse Memoirs woff2 |
| `TEARDOWN.md` | measured design system + every animation's exact params |
| `ROUTING.md` | surface routing (all DOM, no GPU) |
| `CLONE-REPORT.md` | QA numbers and known gaps |
| `*.mjs` (root) | recon / QA scripts — not needed to run the site |

## Troubleshooting

**`error: Script not found "dev"`** — you are in a folder whose `package.json`
has no `dev` script. Either run from this folder or from `site/`.

**`Port 5273 is already in use`** — a dev server from an earlier session is
still running. Find and kill only that one:

```powershell
# PowerShell — show what holds the port
Get-NetTCPConnection -LocalPort 5273 -State Listen |
  ForEach-Object { Get-Process -Id $_.OwningProcess }

# then kill by the PID it printed
Stop-Process -Id <PID> -Force
```

Or just use a different port: `bun run dev -- --port 5290`.

**`Port 5273 is already in use` right after `bun install`** — this is almost
always a *previous* `bun run dev` from another terminal window, not a bug in the
project.

**Page is blank / no animation** — open `http://localhost:5273` (not a `file://`
path). Vite must be serving it; the app is a module build, not a static file.

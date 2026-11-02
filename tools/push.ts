#!/usr/bin/env bun
/**
 * push — commit everything and push to origin/main.
 *
 * Why this exists: the repo's default branch on GitHub is `main`, but earlier
 * work happened on `master` and `feat/*`, which left the GitHub landing page
 * showing an older tree. This script always lands on `main`.
 *
 * Usage:
 *   bun run push                     # commit with a generated message
 *   bun run push "my commit message" # commit with your message
 *   bun run push --dry               # show what would be pushed, change nothing
 *
 * Safety model — the guards are UNCONDITIONAL:
 *
 *   Every path that can reach `git push` first calls verifyPublishable(), which
 *   checks *the whole publish range* — the commits already ahead of origin/main
 *   PLUS the staged index — not just the current delta. That closes two holes
 *   the previous version had:
 *
 *     1. The "clean tree but ahead of origin" branch used to push and exit before
 *        either guard ran, so an already-committed secret or key was published
 *        without inspection.
 *     2. Both guards used to read only `git diff --cached`, so nothing that was
 *        committed earlier was ever covered.
 *
 *   Secret scanning reads the BLOB THAT WILL BE COMMITTED (`git show :path` for
 *   staged files, `git show rev:path` for commits in the range), not the working
 *   tree. The previous version read the worktree, so `git add secret` followed by
 *   reverting the working copy committed a secret the scanner never saw.
 *
 *   `--dry` does not touch the index at all.
 *
 * This is a guardrail against accident. It is not an authorization control: the
 * script uses whatever git credential the workstation already has.
 */
import { $ } from 'bun';

const dry = process.argv.includes('--dry');
// Join everything that is not a flag into one message. Necessary because some
// shells split on ":" — passing `"chore: foo"` from PowerShell used to arrive
// as the single token `"chore:` and the subject was truncated.
const msgArg =
  process.argv
    .slice(2)
    .filter((a) => !a.startsWith('--'))
    .join(' ')
    .trim() || undefined;

const run = async (cmd: string[]) => {
  const r = await $`${cmd}`.quiet().nothrow();
  return { code: r.exitCode, out: r.stdout.toString().trim(), err: r.stderr.toString().trim() };
};

// ── guards ────────────────────────────────────────────────────────────────
const branch = (await run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])).out;
if (branch !== 'main') {
  console.error(`✖ on branch "${branch}", expected "main".`);
  console.error('  run: git checkout main');
  process.exit(1);
}

/** Never publish these, no matter how they got into the tree. */
const FORBIDDEN_PATH =
  /(^|\/)\.env$|(^|\/)\.env\.(?!example)|\.(pem|key|p12|pfx|crt)$|\.(db|sqlite3?)$|(^|\/)node_modules\/|(^|\/)id_(rsa|dsa|ecdsa|ed25519)$|(^|\/)\.npmrc$|(^|\/)\.netrc$|(^|\/)credentials$/;

/**
 * Secret patterns. Deliberately broader than the previous five: the provider
 * prefixes below cover the token shapes most likely to be pasted into a config
 * or a markdown note, and the generic assignment form catches the
 * `SESSION_SECRET=` / `API_KEY=` shapes that .env.example itself tells the
 * operator to generate.
 */
const SECRET_PATTERNS: RegExp[] = [
  /sk_live_[A-Za-z0-9]{10,}/,
  /sk_test_[A-Za-z0-9]{10,}/,
  /sk-proj-[A-Za-z0-9_-]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[A-Za-z0-9]{30,}/,
  /github_pat_[A-Za-z0-9_]{30,}/,
  /glpat-[A-Za-z0-9_-]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /AIza[0-9A-Za-z_-]{35}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bBearer\s+[A-Za-z0-9._-]{20,}/,
  /(?:^|[^A-Za-z0-9])(?:[A-Z0-9_]*(?:SECRET|PASSWORD|PASSWD|TOKEN|API_?KEY|ACCESS_?KEY)[A-Z0-9_]*)\s*[:=]\s*['"]?[A-Za-z0-9/+=_-]{16,}/,
  // scheme://user:password@host
  /[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/:@]{6,}@/i,
];

/**
 * Files worth reading as text. Instead of an extension allowlist (which silently
 * skipped bun.lock, extensionless keys, .crt and .npmrc), every file is scanned
 * unless it is a known binary type or is large enough that reading it is not
 * reasonable. Lockfiles ARE scanned: bun.lock is the one generated file where a
 * registry-supplied string could land.
 */
const BINARY_EXT =
  /\.(png|jpe?g|gif|webp|avif|ico|bmp|tiff?|woff2?|ttf|otf|eot|mp4|webm|mov|mp3|wav|ogg|pdf|zip|gz|tgz|bz2|xz|7z|rar|jar|wasm|so|dll|dylib|exe|bin|class|o|a)$/i;
const MAX_SCAN_BYTES = 2 * 1024 * 1024;

function looksScannable(path: string): boolean {
  return !BINARY_EXT.test(path);
}

/** Return the first matching secret pattern in a body, or null. */
function findSecret(body: string): RegExp | null {
  for (const re of SECRET_PATTERNS) if (re.test(body)) return re;
  return null;
}

/**
 * Verify everything that would become part of `origin/main`.
 *
 * `range` entries are `<rev>:<path>` for commits ahead of origin, `staged`
 * entries are working-tree-relative paths read out of the index. Both are read
 * from git objects, never from the working tree.
 */
async function verifyPublishable(opts: {
  aheadRange: string[];
  stagedPaths: string[];
}): Promise<void> {
  const forbidden: string[] = [];
  const leaks: Array<{ path: string; where: string }> = [];

  const check = async (path: string, where: string, body: () => Promise<string>) => {
    if (FORBIDDEN_PATH.test(path)) {
      forbidden.push(`${path}  (${where})`);
      return;
    }
    if (!looksScannable(path)) return;
    const text = await body().catch(() => '');
    if (!text) return;
    if (text.length > MAX_SCAN_BYTES) return;
    if (findSecret(text)) leaks.push({ path, where });
  };

  // 1. Commits already ahead of origin/main — read from the commit objects.
  for (const rev of opts.aheadRange) {
    const files = (await run(['git', 'show', '--pretty=format:', '--name-only', rev])).out
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const f of files) {
      await check(f, `in ${rev.slice(0, 8)}`, async () =>
        (await run(['git', 'show', `${rev}:${f}`])).out,
      );
    }
  }

  // 2. The staged index — read the blob that will actually be committed.
  //
  //    A path from `git status` may be UNTRACKED, in which case `git show :path`
  //    fails (there is no index entry yet) and the body would come back empty,
  //    letting a brand-new file through unscanned. For those, read the working
  //    tree — which is exactly what `add -A` would stage for a new file. For a
  //    tracked path, read the index, so a file edited after staging is still
  //    scanned in its committed form.
  for (const f of opts.stagedPaths) {
    const inIndex = (await run(['git', 'ls-files', '--error-unmatch', '--', f])).code === 0;
    await check(f, inIndex ? 'staged' : 'new file', async () => {
      if (inIndex) return (await run(['git', 'show', `:${f}`])).out;
      return Bun.file(f)
        .text()
        .catch(() => '');
    });
  }

  if (forbidden.length) {
    console.error('✖ refusing to publish forbidden paths:');
    forbidden.forEach((f) => console.error('   ' + f));
    process.exit(1);
  }
  if (leaks.length) {
    console.error('✖ secret pattern found in:');
    leaks.forEach((l) => console.error(`   ${l.path}  (${l.where})`));
    process.exit(1);
  }
}

// ── what is staged / ahead ────────────────────────────────────────────────
// `--dry` must not mutate the index, so staging is conditional. To still report
// what a real run would publish, the dry run reads `git status --porcelain`
// (which lists exactly what `add -A` would pick up) instead of staging.
if (!dry) await run(['git', 'add', '-A']);

const staged = dry
  ? (await run(['git', 'status', '--porcelain', '--untracked-files=all'])).out
      .split('\n')
      .filter(Boolean)
      // Porcelain v1 is `XY <path>`. Do NOT slice a fixed width: the shared
      // `run()` trims stdout, which eats the leading space of the FIRST line and
      // would shift the path by one character. Match the status columns instead.
      // Renames read `XY <old> -> <new>`, so keep the destination.
      .map((line) => {
        const m = /^[ MADRCU?!]{1,2}\s+(.+)$/.exec(line);
        return (m ? m[1] : line).replace(/^.* -> /, '').trim();
      })
      .filter(Boolean)
  : (await run(['git', 'diff', '--cached', '--name-only'])).out
      .split('\n')
      .filter(Boolean);

const aheadRevs = (await run(['git', 'rev-list', 'origin/main..main'])).out
  .split('\n')
  .filter(Boolean);

/** Push origin/main and report. Every caller has already run the guards. */
async function pushToMain(): Promise<void> {
  const push = await run(['git', 'push', 'origin', 'main']);
  if (push.code !== 0) {
    console.error('✖ push failed:\n' + (push.err || push.out));
    process.exit(1);
  }
  const head = (await run(['git', 'log', '--oneline', '-1'])).out;
  console.log(`✓ pushed to origin/main — ${head}`);
}

// ── nothing to commit ─────────────────────────────────────────────────────
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
const message = msgArg ?? `chore: update (${stamp})`;

if (!staged.length) {
  if (aheadRevs.length) {
    // Commits already exist locally. They are still verified before publishing —
    // this is the path that previously bypassed both guards entirely.
    if (dry) {
      console.log(`DRY RUN — ${aheadRevs.length} commit(s) ahead of origin/main would be verified then pushed:`);
      aheadRevs.forEach((r) => console.log('   ' + r.slice(0, 8)));
      await verifyPublishable({ aheadRange: aheadRevs, stagedPaths: [] });
      console.log('\nGUARDS PASSED — a real run would push.');
      process.exit(0);
    }
    await verifyPublishable({ aheadRange: aheadRevs, stagedPaths: [] });
    console.log(`✓ ${aheadRevs.length} commit(s) ahead, guards passed — pushing.`);
    await pushToMain();
    process.exit(0);
  }
  console.log('✓ already up to date with origin/main; nothing to do.');
  process.exit(0);
}

// ── dry run: verify, report, change nothing ───────────────────────────────
if (dry) {
  console.log('DRY RUN — would commit and push these files:');
  staged.forEach((f) => console.log('   ' + f));
  console.log(`\nmessage: ${message}`);
  await verifyPublishable({ aheadRange: aheadRevs, stagedPaths: staged });
  console.log('\nGUARDS PASSED — a real run would commit and push.');
  process.exit(0);
}

// ── commit ────────────────────────────────────────────────────────────────
// Verify BEFORE committing, so a refused publish leaves no commit behind.
await verifyPublishable({ aheadRange: aheadRevs, stagedPaths: staged });

const commit = await run(['git', 'commit', '-m', message]);
if (commit.code !== 0) {
  console.error('✖ commit failed:\n' + (commit.err || commit.out));
  process.exit(1);
}
console.log(`✓ committed ${staged.length} file(s): ${message}`);

// ── push ──────────────────────────────────────────────────────────────────
await pushToMain();

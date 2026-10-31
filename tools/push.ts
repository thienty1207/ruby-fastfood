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
 *   bun run push --dry               # show what would be pushed, do nothing
 *
 * Safety: refuses to push if a `.env`, private key, database file, or a
 * secret-looking string would be committed. Refuses on a detached HEAD.
 */
import { $ } from 'bun';

const dry = process.argv.includes('--dry');
const msgArg = process.argv.slice(2).find((a) => !a.startsWith('--'));

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

await run(['git', 'add', '-A']);
const staged = (await run(['git', 'diff', '--cached', '--name-only'])).out
  .split('\n')
  .filter(Boolean);

if (!staged.length) {
  console.log('✓ nothing to commit; working tree clean.');
  const ahead = (await run(['git', 'rev-list', '--count', 'origin/main..main'])).out;
  if (ahead && ahead !== '0') {
    console.log(`  ${ahead} commit(s) ahead of origin/main — pushing.`);
  } else {
    console.log('  already up to date with origin/main.');
    process.exit(0);
  }
}

// blocked paths — never commit these, even if someone forces them in
const forbidden = staged.filter((f) =>
  /(^|\/)\.env$|(^|\/)\.env\.(?!example)|\.(pem|key|p12|pfx)$|\.(db|sqlite3?)$|(^|\/)node_modules\//.test(
    f,
  ),
);
if (forbidden.length) {
  console.error('✖ refusing to commit sensitive paths:');
  forbidden.forEach((f) => console.error('   ' + f));
  process.exit(1);
}

// secret-looking content in staged text files
const secretRe =
  /sk_live_[A-Za-z0-9]{10,}|sk_test_[A-Za-z0-9]{10,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/;
const textFiles = staged.filter((f) => /\.(ts|tsx|js|mjs|cjs|json|astro|css|md|toml|ya?ml|txt)$/.test(f));
const leaks: string[] = [];
for (const f of textFiles) {
  const body = await Bun.file(f)
    .text()
    .catch(() => '');
  if (secretRe.test(body)) leaks.push(f);
}
if (leaks.length) {
  console.error('✖ secret pattern found in:');
  leaks.forEach((f) => console.error('   ' + f));
  process.exit(1);
}

// ── commit ────────────────────────────────────────────────────────────────
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
const message = msgArg ?? `chore: update (${stamp})`;

if (dry) {
  console.log('DRY RUN — would commit these files:');
  staged.forEach((f) => console.log('   ' + f));
  console.log(`\nmessage: ${message}`);
  process.exit(0);
}

const commit = await run(['git', 'commit', '-m', message]);
if (commit.code !== 0) {
  console.error('✖ commit failed:\n' + (commit.err || commit.out));
  process.exit(1);
}
console.log(`✓ committed ${staged.length} file(s): ${message}`);

// ── push ──────────────────────────────────────────────────────────────────
const push = await run(['git', 'push', 'origin', 'main']);
if (push.code !== 0) {
  console.error('✖ push failed:\n' + (push.err || push.out));
  process.exit(1);
}
const head = (await run(['git', 'log', '--oneline', '-1'])).out;
console.log(`✓ pushed to origin/main — ${head}`);

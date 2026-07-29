import { requireEnv } from '../lib/env.mjs';
import { $, reporter, requireGh } from '../lib/shell.mjs';
import { releaseTag, releaseVersion } from './version.mjs';

const log = reporter('release');

requireEnv(['GITHUB_TOKEN']);

const gh = await requireGh(log);

const tag = releaseTag();
const version = releaseVersion();
const args = process.argv.slice(2);
const only = args.find((arg) => arg === '--desktop' || arg === '--android');

const releaseState = async () => {
  const result = await $`${gh} release view ${tag} --json isDraft`.nothrow().quiet();

  if (result.exitCode !== 0) {
    return 'missing';
  }

  return JSON.parse(result.stdout.toString()).isDraft ? 'draft' : 'published';
};

const ensureDraft = async () => {
  const state = await releaseState();

  if (state === 'published') {
    log.fail(
      `${tag} is already published — bump the version in package.json before releasing again`
    );
  }

  if (state === 'draft') {
    log.info(`draft ${tag} exists — reusing it`);

    return;
  }

  const notes = [
    `GnomeVPN ${tag}`,
    '',
    '**Windows** — `.exe` installer (installs the tunnel service, auto-update enabled)',
    '**Android** — `.apk` for manual install, `.aab` for Google Play'
  ].join('\n');

  log.step(`create draft ${tag}`);
  await $`${gh} release create ${tag} --title ${`GnomeVPN ${tag}`} --draft --notes ${notes}`;
};

const buildDesktop = () => $`bun scripts/release/desktop.mjs`;
const buildAndroid = () => $`bun scripts/release/android.mjs`;

await ensureDraft();

if (only === '--desktop') {
  await buildDesktop();
} else if (only === '--android') {
  await buildAndroid();
} else {
  await buildDesktop();
  await buildAndroid();
}

log.step(`publish ${tag}`);
await $`${gh} release edit ${tag} --draft=false --latest`;

log.info(`released GnomeVPN ${version} → ${tag}`);

process.exit(0);

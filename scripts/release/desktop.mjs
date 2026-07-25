import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { requireEnv } from '../lib/env.mjs';
import { $, reporter, requireGh, workspace } from '../lib/shell.mjs';
import { ensureNativeBinaries } from './native.mjs';
import { releaseTag, releaseVersion } from './version.mjs';

const log = reporter('release:desktop');

const creds = requireEnv(['NEXT_PUBLIC_API_URL']);

const tag = releaseTag();
const version = releaseVersion();
const gh = await requireGh(log);

const tauri = join(workspace, 'apps', 'tauri');
const signingKey = join(homedir(), '.tauri', 'gnomevpn.key');
const bundleDir = join(workspace, 'target', 'release', 'bundle');

if (!existsSync(signingKey)) {
  log.fail(
    `signing key not found at ${signingKey} — run \`bun run --filter @gnomevpn/tauri signer:generate\``,
  );
}

const collectArtifacts = () => {
  const nsis = join(bundleDir, 'nsis');

  if (!existsSync(nsis)) {
    log.fail(`no NSIS bundle at ${nsis} — did tauri build succeed?`);
  }

  const artifacts = readdirSync(nsis)
    .filter((name) => name.includes(version) && (name.endsWith('.exe') || name.endsWith('.sig')))
    .map((name) => join(nsis, name));

  if (!artifacts.length) {
    log.fail(`no NSIS artifacts for ${version} in ${nsis}`);
  }

  return artifacts;
};

const buildEnv = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_PUBLIC_API_URL: creds.NEXT_PUBLIC_API_URL,
  TAURI_SIGNING_PRIVATE_KEY: readFileSync(signingKey, 'utf8'),
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: '',
};

ensureNativeBinaries();

log.step('build tunnel service (release)');
await $`node ./scripts/build-service.mjs --release`.cwd(tauri);

log.step('apply app icons');
await $`bunx tauri icon icon.manifest.json -o icons`.cwd(tauri).env(buildEnv);

log.step(`tauri build (signed, api=${buildEnv.NEXT_PUBLIC_API_URL})`);
await $`bunx tauri build`.cwd(tauri).env(buildEnv);

const artifacts = collectArtifacts();

log.step(`upload ${artifacts.length} artifacts to ${tag}`);
await $`${gh} release upload ${tag} ${artifacts} --clobber`;

log.info(`desktop published to ${tag}`);

process.exit(0);

import { requireEnv } from '@gnomevpn/scripts/env';
import { $, requireGh, workspace } from '@gnomevpn/scripts/local';
import { reporter } from '@gnomevpn/scripts/reporter';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';

import { ensureNativeBinaries } from './native.mjs';
import { releaseTag, releaseVersion } from './version.mjs';

const log = reporter('release:desktop');

const creds = requireEnv(['NEXT_PUBLIC_API_URL', 'GHCR_OWNER']);

const tag = releaseTag();
const version = releaseVersion();
const gh = await requireGh(log);

const tauri = join(workspace, 'apps', 'tauri');
const signingKey = join(homedir(), '.tauri', 'gnomevpn.key');
const bundleDir = join(workspace, 'target', 'release', 'bundle');

if (!existsSync(signingKey)) {
  log.fail(`signing key not found at ${signingKey} — run \`bun run --filter @gnomevpn/tauri signer:generate\``);
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

const writeUpdaterManifest = (artifacts) => {
  const installer = artifacts.find((path) => path.endsWith('.exe'));
  const signaturePath = artifacts.find((path) => path.endsWith('.sig'));

  if (!installer || !signaturePath) {
    log.fail('cannot build latest.json — installer or .sig missing');
  }

  const fileName = basename(installer);

  const manifest = {
    version,
    notes: '',
    pub_date: new Date().toISOString(),
    platforms: {
      'windows-x86_64': {
        signature: readFileSync(signaturePath, 'utf8'),
        url: `https://github.com/${creds.GHCR_OWNER}/GnomeVPN/releases/download/${tag}/${fileName}`
      }
    }
  };

  const manifestPath = join(bundleDir, 'nsis', 'latest.json');

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return manifestPath;
};

const buildEnv = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_PUBLIC_API_URL: creds.NEXT_PUBLIC_API_URL,
  TAURI_SIGNING_PRIVATE_KEY: readFileSync(signingKey, 'utf8'),
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ''
};

ensureNativeBinaries();

log.step('build tunnel service (release)');
await $`node ./scripts/build-service.mjs --release`.cwd(tauri);

log.step('apply app icons');
await $`bunx tauri icon icon.manifest.json -o icons`.cwd(tauri).env(buildEnv);

log.step(`tauri build (signed, api=${buildEnv.NEXT_PUBLIC_API_URL})`);
await $`bunx tauri build`.cwd(tauri).env(buildEnv);

const artifacts = collectArtifacts();
const manifest = writeUpdaterManifest(artifacts);
const uploads = [...artifacts, manifest];

log.step(`upload ${uploads.length} artifacts to ${tag}`);
await $`${gh} release upload ${tag} ${uploads} --clobber`;

log.info(`desktop published to ${tag}`);

process.exit(0);

import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { paths, reporter } from './lib/shell.mjs';

// Kept in step with bin/README.md. Android runs hysteria from the app's native
// library directory, which is why each ABI gets a `libhysteria.so` rather than
// an asset — see apps/tauri/CLAUDE.md.
const VERSION = '2.12.1';

const LIBRARY = 'libhysteria.so';

// jniLibs directory name → the asset architecture suffix in the release.
const ABIS = {
  'arm64-v8a': 'arm64',
  'armeabi-v7a': 'armv7',
  x86_64: 'amd64'
};

const log = reporter('fetch-hysteria');

const force = process.argv.includes('--force');

for (const [abi, architecture] of Object.entries(ABIS)) {
  const directory = join(paths.android, 'libs', abi);
  const destination = join(directory, LIBRARY);

  if (existsSync(destination) && !force) {
    continue;
  }

  const url = `https://github.com/apernet/hysteria/releases/download/app%2Fv${VERSION}/hysteria-android-${architecture}`;

  log.info(`downloading ${abi}`);

  const response = await fetch(url);

  if (!response.ok) {
    log.fail(`download failed for ${abi}: ${response.status} ${response.statusText}`);
  }

  mkdirSync(directory, { recursive: true });
  writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
  chmodSync(destination, 0o755);
}

log.info(`hysteria ${VERSION} ready for ${Object.keys(ABIS).join(', ')}`);

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { isWindows, paths, reporter } from './lib/shell.mjs';

// Both are resolved from the service's own directory: wintun.dll through
// LoadLibraryExW, sing-box.exe by spawning it as a child. Neither is found
// elsewhere, so they land flat next to the service in target/, whatever
// subfolder they live in under bin/.
const BINARIES = [
  { from: join('wintun', 'wintun.dll'), name: 'wintun.dll' },
  { from: join('singbox', 'sing-box.exe'), name: 'sing-box.exe' },
];

const PROFILES = ['debug', 'release'];

const log = reporter('sync-bin');

if (!isWindows) {
  process.exit(0);
}

for (const binary of BINARIES) {
  const source = join(paths.bin, binary.from);

  if (!existsSync(source)) {
    log.fail(`apps/tauri/bin/${binary.from} not found — see bin/README.md`);
  }

  for (const profile of PROFILES) {
    const directory = join(paths.target, profile);

    mkdirSync(directory, { recursive: true });
    copyFileSync(source, join(directory, binary.name));
  }
}

log.info(`${BINARIES.map((binary) => binary.name).join(', ')} copied to target/{${PROFILES}}`);

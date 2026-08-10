import { chmodSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { isWindows, paths, reporter } from './lib/shell.mjs';

// Everything here is resolved from the service's own directory: wintun.dll
// through LoadLibraryExW, sing-box by spawning it as a child. Neither is found
// elsewhere, so they land flat next to the service in target/, whatever
// subfolder they live in under bin/.
//
// wintun is Windows-only — Linux and macOS have TUN in the kernel
// (/dev/net/tun and utun).
const WINDOWS_BINARIES = [
  { from: join('wintun', 'wintun.dll'), name: 'wintun.dll' },
  { from: join('singbox', 'sing-box.exe'), name: 'sing-box.exe' }
];

const UNIX_BINARIES = [{ from: join('singbox', 'sing-box'), name: 'sing-box' }];

const PROFILES = ['debug', 'release'];

const log = reporter('sync-bin');

const binaries = isWindows ? WINDOWS_BINARIES : UNIX_BINARIES;

for (const binary of binaries) {
  const source = join(paths.bin, binary.from);

  if (!existsSync(source)) {
    log.fail(`apps/tauri/bin/${binary.from} not found — see bin/README.md`);
  }

  for (const profile of PROFILES) {
    const directory = join(paths.target, profile);
    const destination = join(directory, binary.name);

    mkdirSync(directory, { recursive: true });
    copyFileSync(source, destination);

    if (!isWindows) {
      chmodSync(destination, 0o755);
    }
  }
}

log.info(`${binaries.map((binary) => binary.name).join(', ')} copied to target/{${PROFILES}}`);

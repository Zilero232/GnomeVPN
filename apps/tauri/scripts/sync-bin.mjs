import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const binDir = join(here, '..', 'bin');
const workspaceTarget = join(here, '..', '..', 'target');
const profiles = ['debug', 'release'];

// Both are resolved from the service's own directory: wintun.dll through
// LoadLibraryExW, hysteria.exe by spawning it as a child. Neither is found
// elsewhere, so they land flat next to the service in target/, whatever
// subfolder they live in under bin/.
const files = [
  { from: join('wintun', 'wintun.dll'), name: 'wintun.dll' },
  { from: join('hysteria', 'hysteria.exe'), name: 'hysteria.exe' },
];

if (process.platform !== 'win32') {
  process.exit(0);
}

for (const file of files) {
  const source = join(binDir, file.from);

  if (!existsSync(source)) {
    console.error(`[sync-bin] apps/tauri/bin/${file.from} not found — see bin/README.md`);
    process.exit(1);
  }

  for (const profile of profiles) {
    const dir = join(workspaceTarget, profile);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    copyFileSync(source, join(dir, file.name));
  }
}

// biome-ignore lint/suspicious/noConsole: standalone CLI script, console is the output channel
console.log(
  `[sync-bin] ${files.map((f) => f.name).join(', ')} copied to target/debug and target/release`,
);

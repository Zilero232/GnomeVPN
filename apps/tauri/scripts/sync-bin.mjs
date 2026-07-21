import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const binDir = join(here, '..', 'bin');
const workspaceTarget = join(here, '..', '..', 'target');
const profiles = ['debug', 'release'];

// Both are resolved from the service's own directory: wintun.dll through
// LoadLibraryExW, xray.exe by spawning it as a child. Neither is found elsewhere.
const files = ['wintun.dll', 'xray.exe'];

if (process.platform !== 'win32') {
  process.exit(0);
}

for (const file of files) {
  const source = join(binDir, file);

  if (!existsSync(source)) {
    console.error(`[sync-bin] apps/tauri/bin/${file} not found — see bin/README.md`);
    process.exit(1);
  }

  for (const profile of profiles) {
    const dir = join(workspaceTarget, profile);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    copyFileSync(source, join(dir, file));
  }
}

// biome-ignore lint/suspicious/noConsole: standalone CLI script, console is the output channel
console.log(`[sync-bin] ${files.join(', ')} copied to target/debug and target/release`);

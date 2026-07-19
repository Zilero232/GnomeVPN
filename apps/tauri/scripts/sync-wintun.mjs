import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, '..', 'bin', 'wintun.dll');
const workspaceTarget = join(here, '..', '..', 'target');
const targets = [
  join(workspaceTarget, 'debug', 'wintun.dll'),
  join(workspaceTarget, 'release', 'wintun.dll'),
];

if (process.platform !== 'win32') {
  process.exit(0);
}

if (!existsSync(source)) {
  console.error('[sync-wintun] apps/tauri/bin/wintun.dll not found — see bin/README.md');
  process.exit(1);
}

for (const target of targets) {
  const dir = dirname(target);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  copyFileSync(source, target);
}

// biome-ignore lint/suspicious/noConsole: standalone CLI script, console is the output channel
console.log('[sync-wintun] wintun.dll copied to target/debug and target/release');

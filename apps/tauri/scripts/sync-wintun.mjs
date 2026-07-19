import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, '..', 'bin', 'wintun.dll');
const targets = [
  join(here, '..', 'target', 'debug', 'wintun.dll'),
  join(here, '..', 'target', 'release', 'wintun.dll'),
];

if (process.platform !== 'win32') {
  process.exit(0);
}

if (!existsSync(source)) {
  console.error('[sync-wintun] apps/tauri/bin/wintun.dll не найден — см. bin/README.md');
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
console.log('[sync-wintun] wintun.dll скопирован в target/debug и target/release');

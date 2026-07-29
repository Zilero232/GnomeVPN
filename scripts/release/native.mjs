import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { reporter, workspace } from '../lib/shell.mjs';

const log = reporter('release:native');

const REQUIRED = [
  join('apps', 'tauri', 'bin', 'wintun', 'wintun.dll'),
  join('apps', 'tauri', 'bin', 'singbox', 'sing-box.exe')
];

export const ensureNativeBinaries = () => {
  const missing = REQUIRED.filter((path) => !existsSync(join(workspace, path)));

  if (missing.length) {
    log.fail(
      [
        `native binaries missing: ${missing.join(', ')}`,
        '  see apps/tauri/bin/README.md — they are not committed to git'
      ].join('\n')
    );
  }

  log.info('native binaries present');
};

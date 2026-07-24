import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { patchManifest } from './lib/android-manifest.mjs';
import { copyLibs, copyResources, copySources } from './lib/android-overlay.mjs';
import { paths, reporter } from './lib/shell.mjs';

const PACKAGE_PATH = join('ru', 'gnomevpn', 'app');

const log = reporter('android');
const appMain = join(paths.generated, 'app', 'src', 'main');

if (!existsSync(paths.generated)) {
  log.fail('gen/android is missing — run `tauri android init` first');
}

const { abis, removed } = copyLibs({
  from: join(paths.android, 'libs'),
  to: appMain,
});

const sources = copySources({
  from: join(paths.android, 'java'),
  to: join(appMain, 'java', PACKAGE_PATH),
});

const resources = copyResources({
  from: join(paths.android, 'res'),
  to: join(appMain, 'res'),
});

const patched = patchManifest(join(appMain, 'AndroidManifest.xml'));

log.info(
  [
    `libs: ${abis.join(', ')}`,
    removed.length ? `removed: ${removed.join(', ')}` : null,
    `sources: ${sources.join(', ')}`,
    `res: ${resources.join(', ') || 'none'}`,
    `manifest: ${patched ? 'patched' : 'already patched'}`,
  ]
    .filter(Boolean)
    .join(' | '),
);

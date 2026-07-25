import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { workspace } from '../lib/shell.mjs';

const pkg = JSON.parse(readFileSync(join(workspace, 'package.json'), 'utf8'));

export const releaseVersion = () => pkg.version;

export const releaseTag = () => `v${pkg.version}`;

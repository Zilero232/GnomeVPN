import { workspace } from '@gnomevpn/scripts/local';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const pkg = JSON.parse(readFileSync(join(workspace, 'package.json'), 'utf8'));

export const releaseVersion = () => pkg.version;

export const releaseTag = () => `v${pkg.version}`;

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './paths';

const PUBLIC_VARIABLE = /^(NEXT_PUBLIC_[A-Z0-9_]*)=(.*)$/;

export const loadRootEnv = () => {
  const rootEnv = path.resolve(REPO_ROOT, '.env');

  if (!existsSync(rootEnv)) {
    return;
  }

  for (const line of readFileSync(rootEnv, 'utf8').split('\n')) {
    const match = PUBLIC_VARIABLE.exec(line.trim());

    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
};

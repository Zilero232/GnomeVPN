import { randomBytes } from 'node:crypto';
import { hash } from 'bcryptjs';

import { hasEnvKey, readEnvValue } from '../env-file';

import type { ResolvedPanelPassword, ResolvePanelPasswordInput } from './panel-password.types';

const BCRYPT_COST = 12;

export const resolvePanelPassword = async ({
  envFilePath,
  countryCode,
}: ResolvePanelPasswordInput): Promise<ResolvedPanelPassword> => {
  const key = `WG_KEY_${countryCode}`;

  if (await hasEnvKey({ filePath: envFilePath, key })) {
    const password = await readEnvValue({ filePath: envFilePath, key });

    return { password: password as string, isNew: false };
  }

  return { password: randomBytes(16).toString('hex'), isNew: true };
};

export const hashPanelPassword = async (password: string): Promise<string> => {
  const hashed = await hash(password, BCRYPT_COST);

  return hashed.replace(/\$/g, '$$$$');
};

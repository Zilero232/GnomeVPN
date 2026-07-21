import { randomBytes } from 'node:crypto';

import { readEnvValue } from '../env-file';
import {
  NODE_KEY_PREFIX,
  PANEL_PASSWORD_PREFIX,
  PASSWORD_BYTES,
} from './node-credentials.constants';

import type { NodeCredentials, ResolveNodeCredentialsInput } from './node-credentials.types';

export const nodeKeyName = (countryCode: string): string => `${NODE_KEY_PREFIX}${countryCode}`;

export const panelPasswordName = (countryCode: string): string =>
  `${PANEL_PASSWORD_PREFIX}${countryCode}`;

export const resolveNodeCredentials = async ({
  envFilePath,
  countryCode,
}: ResolveNodeCredentialsInput): Promise<NodeCredentials> => {
  const stored = await readEnvValue({
    filePath: envFilePath,
    key: panelPasswordName(countryCode),
  });

  return { password: stored ?? randomBytes(PASSWORD_BYTES).toString('hex') };
};

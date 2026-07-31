import { randomBytes } from 'node:crypto';

import type { NodeCredentials, ResolveNodeCredentialsInput } from './node-credentials.types';

import { readEnvValue } from '../env-file';
import { NODE_KEY_PREFIX, PANEL_PASSWORD_PREFIX, PANEL_PATH_BYTES, PANEL_PATH_PREFIX, PASSWORD_BYTES } from './node-credentials.constants';

export const nodeKeyName = (countryCode: string): string => `${NODE_KEY_PREFIX}${countryCode}`;

export const panelPasswordName = (countryCode: string): string => `${PANEL_PASSWORD_PREFIX}${countryCode}`;

export const panelPathName = (countryCode: string): string => `${PANEL_PATH_PREFIX}${countryCode}`;

export const resolveNodeCredentials = async ({ envFilePath, countryCode }: ResolveNodeCredentialsInput): Promise<NodeCredentials> => {
  const [password, panelPath] = await Promise.all([
    readEnvValue({ filePath: envFilePath, key: panelPasswordName(countryCode) }),
    readEnvValue({ filePath: envFilePath, key: panelPathName(countryCode) })
  ]);

  return {
    password: password ?? randomBytes(PASSWORD_BYTES).toString('hex'),
    panelPath: panelPath ?? randomBytes(PANEL_PATH_BYTES).toString('hex')
  };
};

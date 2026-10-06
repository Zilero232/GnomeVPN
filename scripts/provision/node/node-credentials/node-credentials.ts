import { randomBytes } from 'node:crypto';

import type { NodeCredentials, ResolveNodeCredentialsInput } from './node-credentials.types';

import { readEnvValue } from '../env-file';
import { CREDENTIAL_BYTES, NODE_ENV_PREFIX } from './node-credentials.constants';

export const nodeKeyName = (countryCode: string) => `${NODE_ENV_PREFIX.apiKey}${countryCode}`;

export const panelPasswordName = (countryCode: string) => `${NODE_ENV_PREFIX.panelPassword}${countryCode}`;

export const panelPathName = (countryCode: string) => `${NODE_ENV_PREFIX.panelPath}${countryCode}`;

export const resolveNodeCredentials = async ({ envFilePath, countryCode }: ResolveNodeCredentialsInput): Promise<NodeCredentials> => {
  const [password, panelPath] = await Promise.all([
    readEnvValue({ filePath: envFilePath, key: panelPasswordName(countryCode) }),
    readEnvValue({ filePath: envFilePath, key: panelPathName(countryCode) })
  ]);

  return {
    password: password ?? randomBytes(CREDENTIAL_BYTES.password).toString('hex'),
    panelPath: panelPath ?? randomBytes(CREDENTIAL_BYTES.panelPath).toString('hex')
  };
};

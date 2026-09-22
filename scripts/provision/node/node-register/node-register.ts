import type { RegisterNodeInput, RememberNodeSecretsInput } from './node-register.types';

import { LISTEN_PORT, log, MASQUERADE_HOST } from '../../config';
import { upsertEnvGroup } from '../env-file';
import { nodeKeyName, panelPasswordName, panelPathName } from '../node-credentials';
import { upsertNode } from '../upsert-node';

const rememberNodeSecrets = async ({ serverEnvPath, countryCode, apiToken, panelPassword, panelPath }: RememberNodeSecretsInput) =>
  upsertEnvGroup({
    filePath: serverEnvPath,
    entries: [
      { key: panelPathName(countryCode), value: panelPath },
      { key: panelPasswordName(countryCode), value: panelPassword },
      { key: nodeKeyName(countryCode), value: apiToken }
    ]
  });

export const registerNode = async ({
  config,
  prisma,
  serverEnvPath,
  panel,
  password,
  panelPath,
  auth,
  cert
}: RegisterNodeInput): Promise<boolean> => {
  log.step('writing the node row and its secrets');

  await rememberNodeSecrets({
    serverEnvPath,
    countryCode: config.countryCode,
    apiToken: panel.token,
    panelPassword: password,
    panelPath
  });

  const { wasExisting } = await upsertNode({
    prisma,
    input: {
      country: config.country,
      countryCode: config.countryCode,
      city: config.city,
      host: config.host,
      port: LISTEN_PORT,
      serverName: MASQUERADE_HOST,
      hysteriaAuth: auth,
      certFingerprint: cert.certFingerprint,
      realityPublicKey: cert.realityPublicKey,
      realityShortId: cert.realityShortId,
      apiUrl: panel.baseUrl,
      apiTokenEnvVar: nodeKeyName(config.countryCode)
    }
  });

  log.done(wasExisting ? 'the node row was updated' : 'the node row was created');

  return wasExisting;
};

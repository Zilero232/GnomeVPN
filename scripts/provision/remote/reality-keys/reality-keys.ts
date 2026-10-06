import type { SshClient } from '@gnomevpn/scripts/ssh';

import { dirOf } from '@gnomevpn/scripts/shell';

import type { EnsuredRealityKeys } from './reality-keys.types';

import { generateRealityKeys, generateRealityShortId } from '../../../../apps/server/src/modules/peers/lib/reality-keys';
import { log, NODE_FILES } from '../../config';
import { inContainer } from '../xray-stack';
import { seedRealityKeysScript } from './reality-keys.helpers';

export const ensureRealityKeys = async (ssh: SshClient): Promise<EnsuredRealityKeys> => {
  const fresh = generateRealityKeys();

  const seed = [
    { path: NODE_FILES.realityKey, value: fresh.privateKey },
    { path: NODE_FILES.realityPub, value: fresh.publicKey },
    { path: NODE_FILES.realitySid, value: generateRealityShortId() }
  ];

  log.step('ensuring the reality server keys');

  const result = await ssh.exec(inContainer(seedRealityKeysScript({ dir: dirOf(NODE_FILES.realityKey), seed })));

  if (result.exitCode !== 0) {
    throw new Error(`cannot reach the panel container to read the Reality keys: ${result.stderr.trim() || 'no output'}`);
  }

  const [privateKey, publicKey, shortId] = result.stdout
    .trim()
    .split('\n')
    .map((value) => value.trim());

  if (!privateKey || !publicKey || !shortId) {
    throw new Error('the panel container returned no Reality keys');
  }

  const wasGenerated = privateKey === fresh.privateKey;

  log.done(wasGenerated ? 'reality keys generated' : 'reality keys already on the node');

  return { privateKey, publicKey, shortId, wasGenerated };
};

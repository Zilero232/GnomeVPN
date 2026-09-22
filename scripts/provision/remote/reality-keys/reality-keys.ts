import type { SshClient } from '@gnomevpn/scripts/ssh';

import { all, arg, dirOf, line, orElse, silent } from '@gnomevpn/scripts/shell';

import type { EnsuredRealityKeys } from './reality-keys.types';

import { generateRealityKeys, generateRealityShortId } from '../../../../apps/server/src/modules/peers/lib/reality-keys';
import { log, REALITY_KEY_PATH, REALITY_PUB_PATH, REALITY_SID_PATH } from '../../config';
import { inContainer } from '../xray-stack';

export const ensureRealityKeys = async (ssh: SshClient): Promise<EnsuredRealityKeys> => {
  const fresh = generateRealityKeys();
  const freshShortId = generateRealityShortId();

  const seed = [
    [REALITY_KEY_PATH, fresh.privateKey],
    [REALITY_PUB_PATH, fresh.publicKey],
    [REALITY_SID_PATH, freshShortId]
  ] as const;

  log.step('ensuring the reality server keys');

  const result = await ssh.exec(
    inContainer(
      all([
        line(['mkdir', '-p', dirOf(REALITY_KEY_PATH)]),
        ...seed.map(([path, value]) => orElse([silent(line(['test', '-s', path])), `printf '%s\\\\n' ${arg(value)} > ${path}`])),
        ...seed.map(([path]) => line(['awk', arg('NR==1{print; exit}'), path]))
      ])
    )
  );

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

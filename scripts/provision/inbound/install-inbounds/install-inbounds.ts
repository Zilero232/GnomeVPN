import type { InstalledInbounds, InstallInboundsInput } from './install-inbounds.types';

import { log, MASQUERADE_HOST } from '../../config';
import { ensureCert, ensureInbound, ensureRealityKeys, ensureVlessInbound, readCertFingerprint } from '../../remote';
import { buildHysteriaInbound } from '../hysteria-inbound';
import { buildRealityInbound } from '../reality-inbound';

export const installInbounds = async ({ ssh, panel, auth }: InstallInboundsInput): Promise<InstalledInbounds> => {
  log.step('installing the inbounds');

  await ensureCert(ssh);

  await ensureInbound({ ...panel, inbound: buildHysteriaInbound({ auth, sni: MASQUERADE_HOST }) });

  const certFingerprint = await readCertFingerprint(ssh);
  const reality = await ensureRealityKeys(ssh);

  await ensureVlessInbound({
    ...panel,
    inbound: buildRealityInbound({ privateKey: reality.privateKey, shortId: reality.shortId })
  });

  return {
    certFingerprint,
    realityPublicKey: reality.publicKey,
    realityShortId: reality.shortId,
    realityWasGenerated: reality.wasGenerated
  };
};

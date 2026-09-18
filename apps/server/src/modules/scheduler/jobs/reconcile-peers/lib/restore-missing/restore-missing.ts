import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { isEmpty } from 'remeda';

import type { RestoreMissingInput } from './restore-missing.types';

import { activeDeviceLimit, describeError } from '../../../../../../common/lib';
import { peerClientName, peerClientNames } from '../../../../../peers';

export const restoreMissing = async ({ logger, xray, node, peers, nodeClients }: RestoreMissingInput): Promise<boolean> => {
  const missing = peers.filter((peer) => !peerClientNames(peer).some((email) => nodeClients.has(email)));

  if (isEmpty(missing)) {
    return false;
  }

  let restored = 0;
  let failed = 0;

  for (const peer of missing) {
    const email = peerClientName(peer);
    const limitIp = activeDeviceLimit(peer.user.subscription);

    try {
      await (peer.protocol === TUNNEL_PROTOCOL.vless
        ? xray.createVlessClient({ email, id: peer.nodeCredential, limitIp, deferRestart: true })
        : xray.createClient({ email, auth: peer.nodeCredential, limitIp, deferRestart: true }));

      nodeClients.set(email, true);
      restored += 1;
    } catch (error) {
      failed += 1;
      logger.warn(`restoring ${email} failed on node ${node.id}: ${describeError(error)}`);
    }
  }

  if (failed > 0) {
    logger.warn(`restoring ${failed} of ${missing.length} peer(s) failed on node ${node.id}`);
  }

  if (restored > 0) {
    logger.log(`restored ${restored} peer(s) missing from node ${node.id}`);
  }

  return restored > 0;
};

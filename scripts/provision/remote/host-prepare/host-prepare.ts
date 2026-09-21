import type { PrepareHostInput } from './host-prepare.types';

import { ensureDocker, ensureJq, openTunnelPort, shipStack } from '../remote-setup';

export const prepareHost = async ({ ssh, xrayComposeContent }: PrepareHostInput) => {
  await ensureDocker(ssh);
  await ensureJq(ssh);
  await openTunnelPort(ssh);

  await shipStack({ ssh, composeContent: xrayComposeContent });
};

import type { PrepareHostInput } from './host-prepare.types';

import { openTunnelPort } from '../firewall';
import { ensureDocker, ensureFail2ban, ensureJq } from '../host-packages';
import { shipStack } from '../xray-stack';

export const prepareHost = async ({ ssh, xrayComposeContent }: PrepareHostInput) => {
  await ensureDocker(ssh);
  await ensureJq(ssh);
  await ensureFail2ban(ssh);
  await openTunnelPort(ssh);

  await shipStack({ ssh, composeContent: xrayComposeContent });
};

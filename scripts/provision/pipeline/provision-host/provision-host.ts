import { SshClient } from '@gnomevpn/scripts/ssh';

import type { ProvisionHostInput, ProvisionResult } from './provision-host.types';

import { generateAuth } from '../../../../apps/server/src/lib/xray';
import { installInbounds } from '../../inbound';
import { registerNode, resolveNodeCredentials } from '../../node';
import { prepareHost, startPanel } from '../../remote';

export const provisionHost = async ({ config, prisma, serverEnvPath, xrayComposeContent }: ProvisionHostInput): Promise<ProvisionResult> => {
  const ssh = new SshClient();
  const outcome = { host: config.host, country: config.country };

  try {
    await ssh.connect({ host: config.host, username: config.sshUser, password: config.sshPassword });

    const { password, panelPath } = await resolveNodeCredentials({
      envFilePath: serverEnvPath,
      countryCode: config.countryCode
    });

    const auth = generateAuth();

    await prepareHost({ ssh, xrayComposeContent });

    const panel = await startPanel({ ssh, host: config.host, password, panelPath });
    const cert = await installInbounds({ ssh, panel, auth });

    const wasExisting = await registerNode({ config, prisma, serverEnvPath, panel, password, panelPath, auth, cert });

    const lostRealityKeys = wasExisting && cert.realityWasGenerated;

    return {
      ...outcome,
      status: wasExisting ? 'updated' : 'provisioned',
      ...(lostRealityKeys && { lostRealityKeys })
    };
  } catch (error) {
    return {
      ...outcome,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    ssh.dispose();
  }
};

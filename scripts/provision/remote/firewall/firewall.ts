import type { SshClient } from '@gnomevpn/scripts/ssh';

import { line } from '@gnomevpn/scripts/shell';

import { log, PORTS } from '../../config';

export const openTunnelPort = async (ssh: SshClient) => {
  const hasUfw = await ssh.exec('command -v ufw');

  if (hasUfw.exitCode !== 0) {
    log.done('no ufw on this host, leaving the firewall alone');

    return;
  }

  const rules = [`${PORTS.hysteria}/udp`, `${PORTS.reality}/tcp`, `${PORTS.panel}/tcp`];

  log.step(`opening ${rules.join(', ')}`);

  for (const rule of rules) {
    await ssh.run(line(['ufw', 'allow', rule]));
  }

  log.done('the tunnel ports are open');
};

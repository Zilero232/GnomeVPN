import type { SshClient } from '@gnomevpn/scripts/ssh';

import { line } from '@gnomevpn/scripts/shell';

import { LISTEN_PORT, log, PANEL_PORT, REALITY_LISTEN_PORT } from '../../config';

export const openTunnelPort = async (ssh: SshClient) => {
  const hasUfw = await ssh.exec('command -v ufw');

  if (hasUfw.exitCode !== 0) {
    log.done('no ufw on this host, leaving the firewall alone');

    return;
  }

  const rules = [`${LISTEN_PORT}/udp`, `${REALITY_LISTEN_PORT}/tcp`, `${PANEL_PORT}/tcp`];

  log.step(`opening ${rules.join(', ')}`);

  for (const rule of rules) {
    await ssh.exec(line(['ufw', 'allow', rule]));
  }

  log.done('the tunnel ports are open');
};

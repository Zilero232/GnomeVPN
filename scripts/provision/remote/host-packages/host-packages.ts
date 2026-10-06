import type { SshClient } from '@gnomevpn/scripts/ssh';

import { all, arg, dirOf, line } from '@gnomevpn/scripts/shell';

import type { EnsureAptInput, IsInstalledInput } from './host-packages.types';

import { log } from '../../config';
import { APT_ENV, DOCKER, FAIL2BAN } from './host-packages.constants';
import { fail2banJail } from './host-packages.helpers';

const isInstalled = async ({ ssh, probe }: IsInstalledInput): Promise<boolean> => {
  const result = await ssh.exec(probe);

  return result.exitCode === 0;
};

const ensureApt = async ({ ssh, name, probe }: EnsureAptInput): Promise<void> => {
  if (await isInstalled({ ssh, probe })) {
    log.done(`${name} is already installed`);

    return;
  }

  log.step(`installing ${name}`);

  await ssh.run(line([APT_ENV, 'apt-get', 'update', '-qq']));
  await ssh.run(line([APT_ENV, 'apt-get', 'install', '-y', '-qq', arg(name)]));

  log.done(`${name} installed`);
};

export const ensureDocker = async (ssh: SshClient) => {
  if (await isInstalled({ ssh, probe: DOCKER.probe })) {
    log.done('docker is already installed');

    return;
  }

  log.step('installing docker');
  await ssh.run(`curl -fsSL ${DOCKER.installUrl} | sh`);

  if (!(await isInstalled({ ssh, probe: DOCKER.probe }))) {
    throw new Error('the docker install script finished, but there is still no docker on the host');
  }

  log.done('docker installed');
};

export const ensureJq = async (ssh: SshClient) => {
  await ensureApt({ ssh, name: 'jq', probe: 'command -v jq' });
};

export const ensureFail2ban = async (ssh: SshClient) => {
  await ensureApt({ ssh, name: 'fail2ban', probe: 'command -v fail2ban-server' });

  log.step(`writing the ssh jail to ${FAIL2BAN.jailPath}`);

  await ssh.run(line(['mkdir', '-p', dirOf(FAIL2BAN.jailPath)]));
  await ssh.putFile({ content: fail2banJail(), remotePath: FAIL2BAN.jailPath });
  await ssh.run(all(['systemctl enable --now fail2ban', 'systemctl reload fail2ban']));

  log.done(`fail2ban bans an ip after ${FAIL2BAN.maxRetry} tries, for ${FAIL2BAN.banTimeSeconds}s`);
};

import { FAIL2BAN } from './host-packages.constants';

export const fail2banJail = () =>
  [
    '[sshd]',
    'enabled = true',
    'backend = systemd',
    `maxretry = ${FAIL2BAN.maxRetry}`,
    `findtime = ${FAIL2BAN.findTimeSeconds}`,
    `bantime = ${FAIL2BAN.banTimeSeconds}`,
    ''
  ].join('\n');

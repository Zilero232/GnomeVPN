export const DOCKER_INSTALL_URL = 'https://get.docker.com';

export const FAIL2BAN = {
  jailPath: '/etc/fail2ban/jail.d/sshd.local',
  maxRetry: 5,
  findTimeSeconds: 600,
  banTimeSeconds: 3600
} as const;

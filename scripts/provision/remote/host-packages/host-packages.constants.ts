export const DOCKER = {
  installUrl: 'https://get.docker.com',
  probe: 'docker --version'
} as const;

export const APT_ENV = 'DEBIAN_FRONTEND=noninteractive';

export const FAIL2BAN = {
  jailPath: '/etc/fail2ban/jail.d/sshd.local',
  maxRetry: 5,
  findTimeSeconds: 600,
  banTimeSeconds: 3600
} as const;

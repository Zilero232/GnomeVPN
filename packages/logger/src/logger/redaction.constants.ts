export const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'password',
  '*.password',
  'sshPassword',
  '*.sshPassword',
  'panelPassword',
  '*.panelPassword',
  'token',
  '*.token',
  'apiToken',
  '*.apiToken',
  'auth',
  '*.auth',
  'nodeCredential',
  '*.nodeCredential',
  'privateKey',
  '*.privateKey'
];

export const CENSOR = '[redacted]';

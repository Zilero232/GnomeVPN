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

export const DEFAULT_LEVEL = {
  development: 'debug',
  production: 'info'
} as const;

export const JSON_FORMAT = 'json';

export const PRETTY_TARGET = 'pino-pretty';

export const TIME_FORMAT = 'HH:MM:ss';

export const BASE_IGNORED = ['pid', 'hostname', 'service'];

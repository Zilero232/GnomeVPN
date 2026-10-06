export const SECRET_FIELDS = [
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'sshPassword',
  'panelPassword',
  'panelPath',
  'token',
  'apiToken',
  'accessToken',
  'refreshToken',
  'idToken',
  'sessionToken',
  'auth',
  'hysteriaAuth',
  'nodeCredential',
  'privateKey',
  'apiUrl',
  'envNodes'
] as const;

export const SECRET_HEADERS = ['authorization', 'cookie', 'x-telegram-bot-api-secret-token'] as const;

export const REDACTED_PATHS = [
  ...SECRET_HEADERS.map((header) => `req.headers["${header}"]`),
  'res.headers["set-cookie"]',
  ...SECRET_FIELDS.flatMap((field) => [field, `*.${field}`])
];

export const CENSOR = '[redacted]';

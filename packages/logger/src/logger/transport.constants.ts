export const TRANSPORT = {
  jsonFormat: 'json',
  prettyTarget: 'pino-pretty',
  timeFormat: 'HH:MM:ss',
  baseIgnored: ['pid', 'hostname', 'service']
} as const;

export const DEFAULT_LEVEL = {
  development: 'debug',
  production: 'info'
} as const;

import pino from 'pino';

import type { Logger } from '../logger';

const isDevelopment = process.env.NODE_ENV !== 'production';

const pinoLogger = pino({
  level: process.env.LOG_LEVEL ?? (isDevelopment ? 'debug' : 'info'),
  base: { service: 'gnomevpn-web' },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'token', '*.token', 'password', '*.password'],
    censor: '[redacted]'
  },
  ...(isDevelopment ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } } } : {})
});

export const serverLogger: Logger = {
  debug: (message, fields) => pinoLogger.debug(fields ?? {}, message),
  info: (message, fields) => pinoLogger.info(fields ?? {}, message),
  warn: (message, fields) => pinoLogger.warn(fields ?? {}, message),
  error: (message, fields) => pinoLogger.error(fields ?? {}, message)
};

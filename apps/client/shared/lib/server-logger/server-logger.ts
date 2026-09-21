import { createLogger } from '@gnomevpn/logger';

import type { Logger } from '../logger';

const pinoLogger = createLogger({ service: 'gnomevpn-web' });

export const serverLogger: Logger = {
  debug: (message, fields) => pinoLogger.debug(fields ?? {}, message),
  info: (message, fields) => pinoLogger.info(fields ?? {}, message),
  warn: (message, fields) => pinoLogger.warn(fields ?? {}, message),
  error: (message, fields) => pinoLogger.error(fields ?? {}, message)
};

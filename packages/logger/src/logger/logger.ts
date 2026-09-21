import type { Logger } from 'pino';

import pino from 'pino';

import type { CreateLoggerInput } from './logger.types';

import { CENSOR, REDACTED_PATHS } from './logger.constants';
import { resolveLevel, resolveTransport } from './logger.helpers';

export const createLogger = ({ service, pretty, level }: CreateLoggerInput): Logger =>
  pino({
    level: resolveLevel(level),
    base: { service },
    redact: { paths: REDACTED_PATHS, censor: CENSOR },
    ...resolveTransport(pretty)
  });

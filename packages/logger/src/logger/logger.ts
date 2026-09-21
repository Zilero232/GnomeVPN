import type { Logger } from 'pino';

import pino from 'pino';

import type { CreateLoggerInput } from './logger.types';

import { resolveLevel, resolveTransport } from './logger.helpers';
import { CENSOR, REDACTED_PATHS } from './redaction.constants';

export const createLogger = ({ service, pretty, level }: CreateLoggerInput): Logger =>
  pino({
    level: resolveLevel(level),
    base: { service },
    redact: { paths: REDACTED_PATHS, censor: CENSOR },
    ...resolveTransport(pretty)
  });

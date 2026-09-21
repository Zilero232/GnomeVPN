import type { LoggerService } from '@nestjs/common';

import { createLogger } from '@gnomevpn/logger';

import type { LogContext } from './logger.types';

import { PRETTY_FORMAT, SERVICE_NAME } from './logger.constants';

const root = createLogger({ service: SERVICE_NAME, pretty: PRETTY_FORMAT });

const contextOf = (context: LogContext) => (context ? { context } : {});

export class AppLogger implements LoggerService {
  log(message: unknown, context?: LogContext) {
    root.info(contextOf(context), String(message));
  }

  error(message: unknown, stack?: string, context?: LogContext) {
    root.error({ ...contextOf(context), ...(stack ? { stack } : {}) }, String(message));
  }

  warn(message: unknown, context?: LogContext) {
    root.warn(contextOf(context), String(message));
  }

  debug(message: unknown, context?: LogContext) {
    root.debug(contextOf(context), String(message));
  }

  verbose(message: unknown, context?: LogContext) {
    root.trace(contextOf(context), String(message));
  }
}

export const appLogger = new AppLogger();

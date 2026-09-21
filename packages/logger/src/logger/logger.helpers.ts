import type { PrettyFormat, TransportOptions } from './logger.types';

import { BASE_IGNORED, DEFAULT_LEVEL, JSON_FORMAT, PRETTY_TARGET, TIME_FORMAT } from './logger.constants';

const isProduction = () => process.env.NODE_ENV === 'production';

export const wantsJson = (): boolean => (process.env.LOG_FORMAT ? process.env.LOG_FORMAT === JSON_FORMAT : isProduction());

export const resolveLevel = (level: string | undefined): string =>
  level ?? process.env.LOG_LEVEL ?? (isProduction() ? DEFAULT_LEVEL.production : DEFAULT_LEVEL.development);

export const resolveTransport = (pretty: PrettyFormat | undefined): TransportOptions => {
  if (wantsJson()) {
    return {};
  }

  const ignore = [...BASE_IGNORED, pretty?.ignore].filter(Boolean).join(',');

  return {
    transport: {
      target: PRETTY_TARGET,
      options: { colorize: true, translateTime: TIME_FORMAT, ignore, ...(pretty && { messageFormat: pretty.messageFormat }) }
    }
  };
};

import type { PrettyFormat, TransportOptions } from './logger.types';

import { DEFAULT_LEVEL, TRANSPORT } from './transport.constants';

const isProduction = () => process.env.NODE_ENV === 'production';

export const wantsJson = (): boolean => (process.env.LOG_FORMAT ? process.env.LOG_FORMAT === TRANSPORT.jsonFormat : isProduction());

export const resolveLevel = (level: string | undefined): string =>
  level ?? process.env.LOG_LEVEL ?? (isProduction() ? DEFAULT_LEVEL.production : DEFAULT_LEVEL.development);

export const resolveTransport = (pretty: PrettyFormat | undefined): TransportOptions => {
  if (wantsJson()) {
    return {};
  }

  const ignore = [...TRANSPORT.baseIgnored, pretty?.ignore].filter(Boolean).join(',');

  return {
    transport: {
      target: TRANSPORT.prettyTarget,
      options: { colorize: true, translateTime: TRANSPORT.timeFormat, ignore, ...(pretty && { messageFormat: pretty.messageFormat }) }
    }
  };
};

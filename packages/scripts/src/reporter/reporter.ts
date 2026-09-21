import { createLogger } from '@gnomevpn/logger';

import type { Reporter } from './reporter.types';

import { PRETTY_FORMAT, SERVICE_NAME } from './reporter.constants';

const root = createLogger({ service: SERVICE_NAME, pretty: PRETTY_FORMAT });

export const reporter = (scope: string): Reporter => {
  const log = root.child({ scope });

  return {
    info: (message, fields) => log.info(fields ?? {}, message),
    step: (message, fields) => log.info(fields ?? {}, `→ ${message}`),
    warn: (message, fields) => log.warn(fields ?? {}, message),
    fail: (message, code = 1) => {
      log.error(message);

      return process.exit(code);
    }
  };
};

import { createLogger } from '@gnomevpn/logger';

import type { LogFields, Reporter } from './reporter.types';

import { PRETTY_FORMAT, SERVICE_NAME } from './reporter.constants';
import { colorFor, paint } from './reporter.helpers';

const root = createLogger({ service: SERVICE_NAME, pretty: PRETTY_FORMAT });

export const reporter = (scope: string): Reporter => {
  const log = root.child({ scope });
  const taken = new Map<string, string>();

  let color: string | undefined;

  const write = (message: string, fields?: LogFields) => log.info(fields ?? {}, paint({ message, color }));

  return {
    info: (message, fields) => write(message, fields),
    step: (message, fields) => write(`→ ${message}`, fields),
    done: (message, fields) => write(`  ${message}`, fields),
    warn: (message, fields) => log.warn(fields ?? {}, paint({ message, color })),
    fail: (message, code = 1) => {
      log.error(message);

      return process.exit(code);
    },
    tint: (key) => {
      const next = colorFor({ key, taken });

      if (next) {
        taken.set(key, next);
      }

      color = next;
    },
    untint: () => {
      color = undefined;
    }
  };
};

import type { LogFields, Logger } from './logger.types';

const toConsole = (write: (...args: unknown[]) => void) => (message: string, fields?: LogFields) =>
  fields ? write(message, fields) : write(message);

/* eslint-disable no-console -- the browser half of the logger is the one place allowed to reach the console */
export const logger: Logger = {
  debug: toConsole(console.debug),
  info: toConsole(console.info),
  warn: toConsole(console.warn),
  error: toConsole(console.error)
};
/* eslint-enable no-console */

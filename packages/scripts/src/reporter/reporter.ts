import type { Reporter } from './reporter.types';

const write = (stream: 'error' | 'log' | 'warn', scope: string, message: string) => {
  console[stream](`[${scope}] ${message}`);
};

export const reporter = (scope: string): Reporter => ({
  info: (message) => write('log', scope, message),
  step: (message) => write('log', scope, `→ ${message}`),
  warn: (message) => write('warn', scope, message),
  fail: (message, code = 1) => {
    write('error', scope, message);

    return process.exit(code);
  }
});

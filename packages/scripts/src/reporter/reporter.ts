import type { Reporter, WriteInput } from './reporter.types';

const write = ({ stream, scope, message }: WriteInput) => {
  console[stream](`[${scope}] ${message}`);
};

export const reporter = (scope: string): Reporter => ({
  info: (message) => write({ stream: 'log', scope, message }),
  step: (message) => write({ stream: 'log', scope, message: `→ ${message}` }),
  warn: (message) => write({ stream: 'warn', scope, message }),
  fail: (message, code = 1) => {
    write({ stream: 'error', scope, message });

    return process.exit(code);
  }
});

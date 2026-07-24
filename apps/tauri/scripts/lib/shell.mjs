import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scripts = dirname(dirname(fileURLToPath(import.meta.url)));

export const paths = {
  tauri: join(scripts, '..'),
  bin: join(scripts, '..', 'bin'),
  android: join(scripts, '..', 'android'),
  generated: join(scripts, '..', 'gen', 'android'),
  workspace: join(scripts, '..', '..', '..'),
  target: join(scripts, '..', '..', '..', 'target'),
};

export const isWindows = process.platform === 'win32';

const write = (stream, scope, message) => {
  // biome-ignore lint/suspicious/noConsole: standalone CLI scripts, console is the output channel
  console[stream](`[${scope}] ${message}`);
};

export const reporter = (scope) => ({
  info: (message) => write('log', scope, message),
  warn: (message) => write('warn', scope, message),
  fail: (message, code = 1) => {
    write('error', scope, message);
    process.exit(code);
  },
});

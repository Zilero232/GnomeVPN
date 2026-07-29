import { debug, error, info, warn } from '@tauri-apps/plugin-log';

import { isTauriDesktop } from '../tauri-platform';

type LogFn = (message: string) => void;

const toTauri =
  (tauriFn: LogFn, consoleFn: LogFn): LogFn =>
  (message: string) => {
    if (!isTauriDesktop()) {
      consoleFn(message);

      return;
    }

    Promise.resolve(tauriFn(message)).catch(() => consoleFn(message));
  };

/* eslint-disable no-console -- browser fallback: the Tauri log plugin is unavailable outside the desktop app */
export const logger = {
  debug: toTauri(debug, console.debug),
  info: toTauri(info, console.info),
  warn: toTauri(warn, console.warn),
  error: toTauri(error, console.error)
};
/* eslint-enable no-console */

import { isTauri } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';

import type { Setting, SettingInput } from './store.types';

import { logger } from '../../logger';

const store = new LazyStore('settings.json', { autoSave: true });

export const setting = <TRead, TWrite = TRead>({ key, fallback, parse }: SettingInput<TRead>): Setting<TRead, TWrite> => {
  const decode = (raw: TRead | undefined): TRead => (parse ? parse(raw) : (raw ?? fallback));

  return {
    get: async () => {
      if (!isTauri()) {
        return decode(undefined);
      }

      try {
        return decode(await store.get<TRead>(key));
      } catch (error) {
        logger.warn(`settings read failed for ${key}: ${String(error)}`);

        return decode(undefined);
      }
    },

    set: async (value) => {
      if (!isTauri()) {
        return;
      }

      try {
        await store.set(key, value);
      } catch (error) {
        logger.warn(`settings write failed for ${key}: ${String(error)}`);
      }
    },

    subscribe: async (listener) => {
      if (!isTauri()) {
        return () => {};
      }

      try {
        return await store.onKeyChange<TRead>(key, (raw) => listener(decode(raw)));
      } catch (error) {
        logger.warn(`settings subscribe failed for ${key}: ${String(error)}`);

        return () => {};
      }
    }
  };
};

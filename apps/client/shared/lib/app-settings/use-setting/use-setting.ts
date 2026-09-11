'use client';

import { useEffect, useState } from 'react';

import type { UseSetting, UseSettingInput } from './use-setting.types';

import { logger } from '../../logger';

export const useSetting = <TRead, TWrite = TRead>({
  setting,
  initial,
  isEnabled = true
}: UseSettingInput<TRead, TWrite>): UseSetting<TRead, TWrite> => {
  const [value, setValue] = useState<TRead>(initial);
  const [isLoading, setIsLoading] = useState(isEnabled);

  useEffect(() => {
    if (!isEnabled) {
      setIsLoading(false);

      return;
    }

    let cancelled = false;
    let unlisten: (() => void) | null = null;

    const load = async () => {
      const stored = await setting.get();

      if (cancelled) {
        return;
      }

      setValue(stored);
      setIsLoading(false);

      unlisten = await setting.subscribe((next) => {
        if (!cancelled) {
          setValue(next);
        }
      });

      if (cancelled) {
        unlisten();
      }
    };

    load().catch((error: unknown) => {
      logger.warn(`cannot read a setting: ${String(error)}`);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [setting, isEnabled]);

  const write = (next: TWrite & TRead) => {
    setValue(next);

    setting.set(next).catch((error: unknown) => {
      logger.warn(`cannot persist a setting: ${String(error)}`);
    });
  };

  return { value, isLoading, write };
};

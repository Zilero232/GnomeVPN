'use client';

import { closeToTraySetting, useSetting } from '@/shared/lib';

import type { UseCloseToTray } from './use-close-to-tray.types';

export const useCloseToTray = (): UseCloseToTray => {
  const { value, write } = useSetting({ setting: closeToTraySetting, initial: true });

  return { closeToTray: value, setCloseToTray: write };
};

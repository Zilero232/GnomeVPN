'use client';

import { useLocalStorage } from '@siberiacancode/reactuse';

import { STORAGE_KEYS } from '@/shared/constants';

type UseCloseToTray = {
  closeToTray: boolean;
  setCloseToTray: (value: boolean) => void;
};

export const useCloseToTray = (): UseCloseToTray => {
  const { value, set } = useLocalStorage<boolean>(STORAGE_KEYS.closeToTray, true);

  return { closeToTray: value ?? true, setCloseToTray: set };
};

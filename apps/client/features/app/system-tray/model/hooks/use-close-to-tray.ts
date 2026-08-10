'use client';

import { useEffect, useState } from 'react';

import { closeToTraySetting } from '@/shared/lib';

type UseCloseToTray = {
  closeToTray: boolean;
  setCloseToTray: (value: boolean) => void;
};

export const useCloseToTray = (): UseCloseToTray => {
  const [closeToTray, setState] = useState(true);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let cancelled = false;

    closeToTraySetting.get().then((value) => {
      if (!cancelled) {
        setState(value);
      }
    });

    closeToTraySetting.subscribe(setState).then((off) => {
      if (cancelled) {
        off();
      } else {
        unlisten = off;
      }
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  const setCloseToTray = (value: boolean) => {
    setState(value);
    closeToTraySetting.set(value);
  };

  return { closeToTray, setCloseToTray };
};

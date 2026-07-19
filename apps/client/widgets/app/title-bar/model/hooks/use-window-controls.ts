'use client';

import { useEffect, useState } from 'react';

import {
  closeMainWindow,
  isMainWindowMaximized,
  isTauriDesktop,
  minimizeMainWindow,
  onMainWindowResized,
  toggleMaximizeMainWindow,
} from '@/shared/lib';

export const useWindowControls = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isTauriDesktop()) {
      return;
    }

    let unlisten: (() => void) | undefined;

    const setup = async () => {
      setIsMaximized(await isMainWindowMaximized());

      unlisten = await onMainWindowResized(async () => {
        setIsMaximized(await isMainWindowMaximized());
      });
    };

    void setup();

    return () => {
      unlisten?.();
    };
  }, []);

  return {
    isMaximized,
    minimize: minimizeMainWindow,
    toggleMaximize: toggleMaximizeMainWindow,
    close: closeMainWindow,
  };
};

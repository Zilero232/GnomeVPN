'use client';

import { useMount } from '@siberiacancode/reactuse';
import { useState } from 'react';

import { isTauriDesktop } from '@/shared/lib';

type UsePlatform = {
  isDesktopApp: boolean;
  isReady: boolean;
};

export const usePlatform = (): UsePlatform => {
  const [isDesktopApp, setIsDesktopApp] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useMount(() => {
    setIsDesktopApp(isTauriDesktop());
    setIsReady(true);
  });

  return { isDesktopApp, isReady };
};

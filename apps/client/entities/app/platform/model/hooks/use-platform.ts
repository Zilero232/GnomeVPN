'use client';

import { useMount } from '@siberiacancode/reactuse';
import { useState } from 'react';

import { isTauriDesktop, isTauriMobile } from '@/shared/lib';

type UsePlatform = {
  isDesktopApp: boolean;
  isMobileApp: boolean;
  isNativeApp: boolean;
  isReady: boolean;
};

export const usePlatform = (): UsePlatform => {
  const [isDesktopApp, setIsDesktopApp] = useState(false);
  const [isMobileApp, setIsMobileApp] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useMount(() => {
    try {
      setIsDesktopApp(isTauriDesktop());
      setIsMobileApp(isTauriMobile());
    } finally {
      setIsReady(true);
    }
  });

  return { isDesktopApp, isMobileApp, isNativeApp: isDesktopApp || isMobileApp, isReady };
};

'use client';

import { usePlatform } from '@/entities/app/platform';
import { DesktopOnlyView } from '@/views/desktop-only';
import { AppView } from './AppView';

export const AppGate = () => {
  const { isDesktopApp, isReady } = usePlatform();

  if (!isReady) {
    return null;
  }

  return isDesktopApp ? <AppView /> : <DesktopOnlyView />;
};

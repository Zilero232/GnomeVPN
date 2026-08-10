'use client';

import type { ReactNode } from 'react';

import { useEffect, useState } from 'react';

import { restoreTokenFromVault } from '@/shared/api';
import { initAutoStartDefault, isTauriDesktop, manuallyDisconnectedSetting } from '@/shared/lib';
import { AppSplash } from '@/shared/ui';

export const VaultProvider = ({ children }: { children: ReactNode }) => {
  const [isBlocking, setIsBlocking] = useState(false);

  useEffect(() => {
    if (!isTauriDesktop()) {
      return;
    }

    setIsBlocking(true);

    initAutoStartDefault().catch(() => undefined);
    manuallyDisconnectedSetting.set(false).catch(() => undefined);

    restoreTokenFromVault()
      .catch(() => false)
      .finally(() => setIsBlocking(false));
  }, []);

  if (isBlocking) {
    return <AppSplash />;
  }

  return children;
};

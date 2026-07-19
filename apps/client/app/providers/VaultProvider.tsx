'use client';

import { useEffect, useState } from 'react';

import { restoreTokenFromVault } from '@/shared/api';
import { initAutoStartDefault, isTauriDesktop } from '@/shared/lib';

import type { ReactNode } from 'react';

export const VaultProvider = ({ children }: { children: ReactNode }) => {
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    if (!isTauriDesktop()) {
      setIsRestored(true);

      return;
    }

    initAutoStartDefault().catch(() => undefined);

    restoreTokenFromVault()
      .catch(() => false)
      .finally(() => setIsRestored(true));
  }, []);

  // Rendering children while the token is still missing would bounce the user
  // to the sign-in screen, but only the desktop app has a vault to wait for —
  // in the browser the effect resolves on the first tick.
  if (!isRestored && isTauriDesktop()) {
    return null;
  }

  return children;
};

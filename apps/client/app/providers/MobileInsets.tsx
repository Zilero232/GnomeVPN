'use client';

import { useEffect } from 'react';
import { isNonNullish } from 'remeda';

import { isTauriMobile } from '@/shared/lib';

const TOP_VAR = '--safe-area-inset-top';
const BOTTOM_VAR = '--safe-area-inset-bottom';

const syncInsets = async () => {
  const api = await import('@saurl/tauri-plugin-safe-area-insets-css-api');
  const [top, bottom] = await Promise.all([api.getTopInset(), api.getBottomInset()]);

  const root = document.documentElement;

  if (isNonNullish(top?.inset)) {
    root.style.setProperty(TOP_VAR, `${top.inset}px`);
  }

  if (isNonNullish(bottom?.inset)) {
    root.style.setProperty(BOTTOM_VAR, `${bottom.inset}px`);
  }
};

export const MobileInsets = () => {
  useEffect(() => {
    if (!isTauriMobile()) {
      return;
    }

    document.documentElement.dataset.mobileApp = 'true';

    const apply = () => {
      syncInsets().catch(() => {});
    };

    apply();

    const viewport = window.visualViewport;

    viewport?.addEventListener('resize', apply);
    window.addEventListener('resize', apply);

    return () => {
      viewport?.removeEventListener('resize', apply);
      window.removeEventListener('resize', apply);

      const root = document.documentElement;

      root.style.removeProperty(TOP_VAR);
      root.style.removeProperty(BOTTOM_VAR);
      delete root.dataset.mobileApp;
    };
  }, []);

  return null;
};

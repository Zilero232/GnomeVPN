'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

const TOAST_SELECTOR = '[data-sonner-toast]';
const ACTION_SELECTOR = 'button, a, [role="button"]';

export const DismissToastOnClick = () => {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;

      if (!target?.closest(TOAST_SELECTOR) || target.closest(ACTION_SELECTOR)) {
        return;
      }

      toast.dismiss();
    };

    document.addEventListener('click', onClick);

    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
};

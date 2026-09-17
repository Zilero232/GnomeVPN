'use client';

import { useEffect } from 'react';
import { toast, Toaster } from 'sonner';

import { ACTION_SELECTOR, TOAST_GAP, TOAST_OPTIONS, TOAST_SELECTOR } from './AppToaster.constants';

export const AppToaster = () => {
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

  return <Toaster className='gnomevpn-toaster' gap={TOAST_GAP} position='top-center' theme='dark' toastOptions={TOAST_OPTIONS} />;
};

'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { isBrowser } from '@/shared/lib';

import { verifyEmailErrorCode } from '../../../lib';

export const useVerifyEmailOutcome = () => {
  const t = useTranslations('auth.verifyEmail');
  const searchParams = useSearchParams();
  const shown = useRef(false);

  const code = verifyEmailErrorCode(searchParams.get('error'));

  useEffect(() => {
    if (!code || shown.current) {
      return;
    }

    shown.current = true;

    toast.error(t(code));

    if (!isBrowser()) {
      return;
    }

    const rest = new URLSearchParams(searchParams);

    rest.delete('error');

    const query = rest.toString();

    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }, [code, searchParams, t]);
};

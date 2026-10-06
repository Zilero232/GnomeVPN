'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { verifyEmailErrorCode } from '../../../lib';

export const useVerifyEmailOutcome = () => {
  const t = useTranslations('auth.verifyEmail');
  const searchParams = useSearchParams();
  const shownRef = useRef(false);

  const code = verifyEmailErrorCode(searchParams.get('error'));

  useEffect(() => {
    if (!code || shownRef.current) {
      return;
    }

    shownRef.current = true;

    toast.error(t(code));

    const rest = new URLSearchParams(searchParams);

    rest.delete('error');

    const query = rest.toString();

    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }, [code, searchParams, t]);
};

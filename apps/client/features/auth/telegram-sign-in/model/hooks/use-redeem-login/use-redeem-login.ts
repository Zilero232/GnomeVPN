'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { ROUTES } from '@/shared/constants';
import { useRouter } from '@/shared/i18n/navigation';

import type { RedeemLoginState } from './use-redeem-login.types';

import { useTelegramSignIn } from '../use-telegram-sign-in';

export const useRedeemLogin = (): RedeemLoginState => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signIn = useTelegramSignIn();
  const redeemRef = useRef(signIn.mutate);
  const redeemedRef = useRef<string | null>(null);

  redeemRef.current = signIn.mutate;

  const code = searchParams.get('code');

  useEffect(() => {
    if (!code || redeemedRef.current === code) {
      return;
    }

    redeemedRef.current = code;

    redeemRef.current(code, { onSuccess: () => router.replace(ROUTES.account) });
  }, [code, router]);

  return { hasFailed: !code || signIn.isError };
};

'use client';

import { useLocale } from 'next-intl';
import { useState } from 'react';
import { isNullish } from 'remeda';

import { ROUTES } from '@/shared/constants';
import { useRouter } from '@/shared/i18n/navigation';

import type { TelegramLoginResult, TelegramLoginState } from './use-telegram-login.types';

import { useTelegramWidget } from '../use-telegram-widget';
import { useWidgetSignIn } from '../use-widget-sign-in';
import { TELEGRAM_LOGIN } from './use-telegram-login.constants';

export const useTelegramLogin = (): TelegramLoginState => {
  const locale = useLocale();
  const router = useRouter();
  const { data: widget } = useTelegramWidget();
  const signIn = useWidgetSignIn();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUnreachable, setIsUnreachable] = useState(false);

  const clientId = widget?.clientId;

  const onAuth = ({ id_token: idToken }: TelegramLoginResult) => {
    if (isNullish(idToken)) {
      return;
    }

    signIn.mutate(idToken, { onSuccess: () => router.replace(ROUTES.account) });
  };

  const signInWithTelegram = () => {
    const login = window.Telegram?.Login;

    if (isNullish(login) || isNullish(clientId)) {
      setIsUnreachable(true);

      return;
    }

    login.auth({ client_id: Number(clientId), scope: [...TELEGRAM_LOGIN.scope], lang: locale }, onAuth);
  };

  return {
    isReady: isLoaded && !isUnreachable && Boolean(clientId),
    isPending: signIn.isPending,
    isError: signIn.isError,
    onScriptLoad: () => setIsLoaded(true),
    onScriptError: () => setIsUnreachable(true),
    signIn: signInWithTelegram
  };
};

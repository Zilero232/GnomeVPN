'use client';

import { useEffect, useRef, useState } from 'react';
import { isNullish } from 'remeda';

import { ROUTES } from '@/shared/constants';
import { useRouter } from '@/shared/i18n/navigation';

import type { TelegramLoginState, TelegramWidgetUser } from './use-telegram-login.types';

import { useTelegramWidget } from '../use-telegram-widget';
import { useWidgetSignIn } from '../use-widget-sign-in';
import { TELEGRAM_LOGIN } from './use-telegram-login.constants';
import { widgetScript } from './use-telegram-login.helpers';

const payloadOf = (user: TelegramWidgetUser): Record<string, string> =>
  Object.fromEntries(Object.entries(user).map(([key, value]) => [key, String(value)]));

export const useTelegramLogin = (): TelegramLoginState => {
  const router = useRouter();
  const { data: widget } = useTelegramWidget();
  const signIn = useWidgetSignIn();
  const slotRef = useRef<HTMLDivElement>(null);
  const signInRef = useRef(signIn.mutate);
  const [isUnreachable, setIsUnreachable] = useState(false);

  signInRef.current = signIn.mutate;

  const botUsername = widget?.botUsername;

  useEffect(() => {
    const slot = slotRef.current;

    if (isNullish(slot) || !botUsername) {
      return;
    }

    window[TELEGRAM_LOGIN.callbackName] = (user) => {
      signInRef.current(payloadOf(user), { onSuccess: () => router.replace(ROUTES.account) });
    };

    slot.append(widgetScript({ botUsername, onError: () => setIsUnreachable(true) }));

    return () => {
      slot.replaceChildren();
      delete window[TELEGRAM_LOGIN.callbackName];
    };
  }, [botUsername, router]);

  return { slotRef, isUnreachable, isPending: signIn.isPending, isError: signIn.isError };
};

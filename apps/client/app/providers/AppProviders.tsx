'use client';

import type { ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';

import type { Locale } from '@/shared/i18n';

import { queryClient } from '@/shared/api';
import { messages, TIME_ZONE } from '@/shared/i18n';
import { AppToaster } from '@/ui-kit';

import { AuthProvider } from './AuthProvider';

type AppProvidersProps = {
  children: ReactNode;
  locale: Locale;
};

export const AppProviders = ({ children, locale }: AppProvidersProps) => (
  <QueryClientProvider client={queryClient}>
    <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone={TIME_ZONE}>
      <AuthProvider>{children}</AuthProvider>

      <AppToaster />
    </NextIntlClientProvider>
  </QueryClientProvider>
);

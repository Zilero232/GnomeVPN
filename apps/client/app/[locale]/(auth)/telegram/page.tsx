import { getTranslations } from 'next-intl/server';
import * as rootParams from 'next/root-params';
import { Suspense } from 'react';

import { ROUTES } from '@/shared/constants';
import { resolveLocale } from '@/shared/i18n';
import { createPageMetadata } from '@/shared/seo';
import { TelegramSignInPage } from '@/views/telegram-sign-in';

export const generateMetadata = async () => {
  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: 'auth' });

  return createPageMetadata({
    title: t('meta.telegramTitle'),
    description: t('meta.telegramDescription'),
    path: ROUTES.telegramSignIn,
    locale
  });
};

const Page = () => (
  <Suspense>
    <TelegramSignInPage />
  </Suspense>
);

export default Page;

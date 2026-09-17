import { getTranslations } from 'next-intl/server';
import * as rootParams from 'next/root-params';
import { Suspense } from 'react';

import { ROUTES } from '@/shared/constants';
import { resolveLocale } from '@/shared/i18n';
import { createPageMetadata } from '@/shared/seo';
import { ResetPasswordPage } from '@/views/reset-password';

export const generateMetadata = async () => {
  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: 'auth' });

  return createPageMetadata({
    title: t('meta.resetTitle'),
    description: t('meta.resetDescription'),
    path: ROUTES.resetPassword,
    locale
  });
};

const Page = () => (
  <Suspense>
    <ResetPasswordPage />
  </Suspense>
);

export default Page;

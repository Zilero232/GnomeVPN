import { getTranslations } from 'next-intl/server';
import * as rootParams from 'next/root-params';
import { Suspense } from 'react';

import { ROUTES } from '@/shared/constants';
import { resolveLocale } from '@/shared/i18n';
import { createPageMetadata } from '@/shared/seo';
import { AccountPage } from '@/views/account';

export const generateMetadata = async () => {
  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: 'account' });

  return createPageMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    path: ROUTES.account,
    locale
  });
};

const Page = () => (
  <Suspense>
    <AccountPage />
  </Suspense>
);

export default Page;

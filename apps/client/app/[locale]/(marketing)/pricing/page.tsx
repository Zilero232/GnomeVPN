import { getTranslations } from 'next-intl/server';
import * as rootParams from 'next/root-params';

import { ROUTES } from '@/shared/constants';
import { resolveLocale } from '@/shared/i18n';
import { createPageMetadata, PageJsonLd } from '@/shared/seo';
import { PricingPage } from '@/views/pricing';

export const generateMetadata = async () => {
  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: 'pricing' });

  return createPageMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    path: ROUTES.pricing,
    locale,
    index: true,
    follow: true
  });
};

const Page = async () => {
  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: 'pricing' });

  return (
    <>
      <PageJsonLd locale={locale} name={t('meta.title')} path={ROUTES.pricing} />

      <PricingPage />
    </>
  );
};

export default Page;

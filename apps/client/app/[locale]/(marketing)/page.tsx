import { getTranslations } from 'next-intl/server';
import * as rootParams from 'next/root-params';

import { ROUTES } from '@/shared/constants';
import { resolveLocale } from '@/shared/i18n';
import { createPageMetadata, JsonLd, serviceJsonLd } from '@/shared/seo';
import { LandingPage } from '@/views/landing';

export const generateMetadata = async () => {
  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: 'landing' });

  return createPageMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    path: ROUTES.landing,
    locale,
    index: true,
    follow: true
  });
};

const Page = async () => {
  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: 'landing' });

  const countries = [t('locations.netherlandsName'), t('locations.finlandName')];

  return (
    <>
      <JsonLd data={serviceJsonLd({ name: t('meta.title'), description: t('meta.description'), countries })} />

      <LandingPage />
    </>
  );
};

export default Page;

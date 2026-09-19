import { getTranslations } from 'next-intl/server';
import * as rootParams from 'next/root-params';

import { ROUTES } from '@/shared/constants';
import { resolveLocale } from '@/shared/i18n';
import { createPageMetadata, howToJsonLd, JsonLd, PageJsonLd } from '@/shared/seo';
import { SETUP_STEPS, SetupPage } from '@/views/setup';

const HOWTO_PLATFORM = 'android';

export const generateMetadata = async () => {
  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: 'setup' });

  return createPageMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    path: ROUTES.setup,
    locale,
    index: true,
    follow: true
  });
};

const Page = async () => {
  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: 'setup' });

  const steps = SETUP_STEPS.map((step) => ({
    name: t(`steps.${step}.title`),
    text: t(`platforms.${HOWTO_PLATFORM}.${step}`)
  }));

  return (
    <>
      <PageJsonLd locale={locale} name={t('meta.title')} path={ROUTES.setup} />

      <JsonLd data={howToJsonLd({ name: t('meta.title'), description: t('meta.description'), steps })} />

      <SetupPage />
    </>
  );
};

export default Page;

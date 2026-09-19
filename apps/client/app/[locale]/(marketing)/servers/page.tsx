import { getTranslations } from 'next-intl/server';
import * as rootParams from 'next/root-params';

import { ROUTES } from '@/shared/constants';
import { resolveLocale } from '@/shared/i18n';
import { createPageMetadata, PageJsonLd } from '@/shared/seo';
import { ServersPage } from '@/views/servers';

export const generateMetadata = async () => {
  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: 'servers' });

  return createPageMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    path: ROUTES.servers,
    locale,
    index: true,
    follow: true
  });
};

const Page = async () => {
  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: 'servers' });

  return (
    <>
      <PageJsonLd locale={locale} name={t('meta.title')} path={ROUTES.servers} />

      <ServersPage />
    </>
  );
};

export default Page;

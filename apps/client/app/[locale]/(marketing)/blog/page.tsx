import { getTranslations } from 'next-intl/server';
import * as rootParams from 'next/root-params';

import { ROUTES } from '@/shared/constants';
import { resolveLocale } from '@/shared/i18n';
import { createPageMetadata, PageJsonLd } from '@/shared/seo';
import { BlogPage } from '@/views/blog';

export const generateMetadata = async () => {
  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: 'blog' });

  return createPageMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    path: ROUTES.blog,
    locale,
    index: true,
    follow: true
  });
};

const Page = async () => {
  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: 'blog' });

  return (
    <>
      <PageJsonLd locale={locale} name={t('meta.title')} path={ROUTES.blog} />

      <BlogPage />
    </>
  );
};

export default Page;

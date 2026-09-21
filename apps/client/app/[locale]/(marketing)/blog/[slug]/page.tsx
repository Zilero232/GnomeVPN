import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';

import { BLOG_SLUGS, isBlogSlug } from '@/entities/app/blog';
import { blogPostRoute } from '@/shared/constants';
import { LOCALES, resolveLocale } from '@/shared/i18n';
import { articleJsonLd, createPageMetadata, JsonLd, PageJsonLd } from '@/shared/seo';
import { BlogPostPage } from '@/views/blog-post';

import type { BlogPostParams } from './page.types';

export const generateStaticParams = () => LOCALES.flatMap((locale) => BLOG_SLUGS.map((slug) => ({ locale, slug })));

export const generateMetadata = async ({ params }: BlogPostParams) => {
  const { slug } = await params;

  if (!isBlogSlug(slug)) {
    return {};
  }

  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: `blog.posts.${slug}` });

  return createPageMetadata({
    title: t('title'),
    description: t('excerpt'),
    path: blogPostRoute(slug),
    locale,
    index: true,
    follow: true
  });
};

const Page = async ({ params }: BlogPostParams) => {
  const { slug } = await params;

  if (!isBlogSlug(slug)) {
    notFound();
  }

  const locale = resolveLocale(await rootParams.locale());
  const t = await getTranslations({ locale, namespace: `blog.posts.${slug}` });

  return (
    <>
      <PageJsonLd locale={locale} name={t('title')} path={blogPostRoute(slug)} />

      <JsonLd data={articleJsonLd({ headline: t('title'), description: t('excerpt'), path: blogPostRoute(slug), locale })} />

      <BlogPostPage slug={slug} />
    </>
  );
};

export default Page;

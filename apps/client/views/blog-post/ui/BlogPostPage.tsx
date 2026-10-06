import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { BLOG_SLUGS, POST_SECTIONS } from '@/entities/app/blog';
import { blogPostRoute, ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { Text } from '@/ui-kit';
import { RelatedLinks } from '@/widgets/site/related-links';

import type { BlogPostPageProps } from './BlogPostPage.types';

import { RELATED_COUNT } from './BlogPostPage.constants';

import s from './BlogPostPage.module.scss';

export const BlogPostPage = ({ slug }: BlogPostPageProps) => {
  const t = useTranslations(`blog.posts.${slug}`);
  const tBlog = useTranslations('blog');

  const related = BLOG_SLUGS.filter((other) => other !== slug).slice(0, RELATED_COUNT);

  return (
    <main className={s.root}>
      <article className={s.article}>
        <header className={s.head}>
          <Link className={s.back} href={ROUTES.blog}>
            <ArrowLeft aria-hidden size={14} />
            {tBlog('back')}
          </Link>

          <Text as='h1' className={s.title}>
            {t('title')}
          </Text>

          <Text as='p' className={s.intro} tone='muted'>
            {t('intro')}
          </Text>
        </header>

        {POST_SECTIONS[slug].map((section) => (
          <section key={section} className={s.section}>
            <Text as='h2' className={s.heading}>
              {t(`sections.${section}.title`)}
            </Text>

            <Text as='p' className={s.body}>
              {t(`sections.${section}.body`)}
            </Text>
          </section>
        ))}
      </article>

      <RelatedLinks links={related.map((other) => ({ href: blogPostRoute(other), label: tBlog(`posts.${other}.title`) }))} />

      <aside className={s.cta}>
        <Text as='p' className={s.body}>
          {tBlog('cta')}
        </Text>

        <Link className={s.ctaLink} href={ROUTES.pricing}>
          {tBlog('ctaAction')}
        </Link>
      </aside>
    </main>
  );
};

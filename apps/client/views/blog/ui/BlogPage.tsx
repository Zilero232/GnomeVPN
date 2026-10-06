import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { BLOG_SLUGS } from '@/entities/app/blog';
import { blogPostRoute } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { Text } from '@/ui-kit';

import s from './BlogPage.module.scss';

export const BlogPage = () => {
  const t = useTranslations('blog');

  return (
    <main className={s.root}>
      <header className={s.head}>
        <Text as='h1' className={s.title}>
          {t('title')}
        </Text>

        <Text as='p' className={s.intro} tone='muted'>
          {t('intro')}
        </Text>
      </header>

      <ul className={s.list}>
        {BLOG_SLUGS.map((slug) => (
          <li key={slug}>
            <Link className={s.card} href={blogPostRoute(slug)}>
              <span className={s.cardBody}>
                <Text as='h2' className={s.cardTitle}>
                  {t(`posts.${slug}.title`)}
                </Text>

                <Text as='p' size='sm' tone='muted'>
                  {t(`posts.${slug}.excerpt`)}
                </Text>
              </span>

              <ArrowRight aria-hidden className={s.cardArrow} size={18} />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
};

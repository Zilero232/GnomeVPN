'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { BLOG_SLUGS } from '@/entities/app/blog';
import { blogPostRoute } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { HEAD_MOTION, PAGE_MOTION, REVEAL_VIEWPORT, ROW_MOTION, SECTION_MOTION } from '@/shared/lib';
import { Text } from '@/ui-kit';

import s from './BlogPage.module.scss';

export const BlogPage = () => {
  const t = useTranslations('blog');

  return (
    <motion.main animate='visible' className={s.root} initial='hidden' variants={PAGE_MOTION}>
      <motion.header className={s.head} variants={HEAD_MOTION}>
        <Text as='h1' className={s.title}>
          {t('title')}
        </Text>

        <Text as='p' className={s.intro} tone='muted'>
          {t('intro')}
        </Text>
      </motion.header>

      <motion.ul className={s.list} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
        {BLOG_SLUGS.map((slug) => (
          <motion.li key={slug} variants={ROW_MOTION}>
            <Link className={s.card} href={blogPostRoute(slug)}>
              <Text as='h2' className={s.cardTitle}>
                {t(`posts.${slug}.title`)}
              </Text>

              <Text as='p' size='sm' tone='muted'>
                {t(`posts.${slug}.excerpt`)}
              </Text>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </motion.main>
  );
};

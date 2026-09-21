'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { POST_SECTIONS } from '@/entities/app/blog';
import { ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { HEAD_MOTION, PAGE_MOTION, REVEAL_VIEWPORT, SECTION_MOTION } from '@/shared/lib';
import { Text } from '@/ui-kit';

import type { BlogPostPageProps } from './BlogPostPage.types';

import s from './BlogPostPage.module.scss';

export const BlogPostPage = ({ slug }: BlogPostPageProps) => {
  const t = useTranslations(`blog.posts.${slug}`);
  const tBlog = useTranslations('blog');

  return (
    <motion.main animate='visible' className={s.root} initial='hidden' variants={PAGE_MOTION}>
      <motion.header className={s.head} variants={HEAD_MOTION}>
        <Link className={s.back} href={ROUTES.blog}>
          {tBlog('back')}
        </Link>

        <Text as='h1' className={s.title}>
          {t('title')}
        </Text>

        <Text as='p' className={s.intro} tone='muted'>
          {t('intro')}
        </Text>
      </motion.header>

      {POST_SECTIONS[slug].map((section) => (
        <motion.section
          key={section}
          className={s.section}
          initial='hidden'
          variants={SECTION_MOTION}
          viewport={REVEAL_VIEWPORT}
          whileInView='visible'
        >
          <Text as='h2' className={s.heading}>
            {t(`sections.${section}.title`)}
          </Text>

          <Text as='p' className={s.body}>
            {t(`sections.${section}.body`)}
          </Text>
        </motion.section>
      ))}

      <motion.aside className={s.cta} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
        <Text as='p' className={s.body}>
          {tBlog('cta')}
        </Text>

        <Link className={s.ctaLink} href={ROUTES.pricing}>
          {tBlog('ctaAction')}
        </Link>
      </motion.aside>
    </motion.main>
  );
};

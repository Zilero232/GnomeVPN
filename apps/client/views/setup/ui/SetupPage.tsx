'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { INCY_PLATFORMS } from '@/entities/app/incy';
import { ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { HEAD_MOTION, PAGE_MOTION, REVEAL_VIEWPORT, SECTION_MOTION } from '@/shared/lib';
import { Button, LinkCard, Tabs, Text } from '@/ui-kit';

import { SETUP_PLATFORMS, SETUP_STEPS } from '../config';
import { SetupSteps } from './components/SetupSteps';

import s from './SetupPage.module.scss';

export const SetupPage = () => {
  const t = useTranslations('setup');
  const tIncy = useTranslations('incy');

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

      <motion.section className={s.download} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
        <Text as='h2' className={s.sectionTitle}>
          {t('downloadTitle')}
        </Text>

        <div className={s.grid}>
          {INCY_PLATFORMS.map(({ id, icon, href }) => (
            <LinkCard key={id} hint={tIncy(`downloads.${id}`)} href={href} icon={icon} label={tIncy(`platforms.${id}`)} />
          ))}
        </div>
      </motion.section>

      <motion.section className={s.steps} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
        <Text as='h2' className={s.sectionTitle}>
          {t('stepsTitle')}
        </Text>

        <Tabs
          items={SETUP_PLATFORMS.map((platform) => ({
            value: platform,
            label: t(`platforms.${platform}.name`),
            content: <SetupSteps platform={platform} steps={SETUP_STEPS} />
          }))}
        />
      </motion.section>

      <motion.section className={s.cta} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
        <Text as='p' className={s.ctaText}>
          {t('ctaText')}
        </Text>

        <Link href={ROUTES.account}>
          <Button>{t('ctaAction')}</Button>
        </Link>
      </motion.section>
    </motion.main>
  );
};

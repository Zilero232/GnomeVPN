'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { usePlatforms } from '@/entities/app/incy';
import { HEAD_MOTION, PAGE_MOTION, REVEAL_VIEWPORT, SECTION_MOTION } from '@/shared/lib';
import { LinkCard, Tabs, Text } from '@/ui-kit';

import { SETUP_PLATFORMS, SETUP_STEPS } from '../config';
import { OtherClients, SetupSteps } from './components';

import s from './SetupPage.module.scss';

export const SetupPage = () => {
  const t = useTranslations('setup');
  const tIncy = useTranslations('incy');
  const platforms = usePlatforms();

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
          {platforms.map(({ id, icon, href }) => (
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
            content: (
              <SetupSteps
                steps={SETUP_STEPS.map((step) => ({
                  key: step,
                  title: t(`steps.${step}.title`),
                  body: t(`platforms.${platform}.${step}`)
                }))}
              />
            )
          }))}
        />
      </motion.section>

      <motion.section className={s.other} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
        <Text as='h2' className={s.sectionTitle}>
          {t('other.title')}
        </Text>

        <OtherClients />
      </motion.section>
    </motion.main>
  );
};

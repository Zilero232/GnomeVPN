'use client';

import { useTranslations } from 'next-intl';

import { INCY_PLATFORMS } from '@/entities/app/incy';
import { ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { Button, LinkCard, Tabs, Text } from '@/ui-kit';

import { SETUP_PLATFORMS, SETUP_STEPS } from '../config';
import { SetupSteps } from './components/SetupSteps';

import s from './SetupPage.module.scss';

export const SetupPage = () => {
  const t = useTranslations('setup');

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

      <section className={s.download}>
        <Text as='h2' className={s.sectionTitle}>
          {t('downloadTitle')}
        </Text>

        <div className={s.grid}>
          {INCY_PLATFORMS.map(({ id, icon, href }) => (
            <LinkCard key={id} href={href} icon={icon} label={t(`platforms.${id}.name`)} />
          ))}
        </div>
      </section>

      <section className={s.steps}>
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
      </section>

      <section className={s.cta}>
        <Text as='p' className={s.ctaText}>
          {t('ctaText')}
        </Text>

        <Link href={ROUTES.account}>
          <Button>{t('ctaAction')}</Button>
        </Link>
      </section>
    </main>
  );
};

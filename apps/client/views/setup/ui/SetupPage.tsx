import { useTranslations } from 'next-intl';

import { usePlatforms } from '@/entities/app/incy';
import { LinkCard, Tabs, Text } from '@/ui-kit';

import { SETUP_PLATFORMS, SETUP_STEPS } from '../config';
import { OtherClients, SetupSteps } from './components';

import s from './SetupPage.module.scss';

export const SetupPage = () => {
  const t = useTranslations('setup');
  const tIncy = useTranslations('incy');
  const platforms = usePlatforms();

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

      <section>
        <Text as='h2' className={s.sectionTitle}>
          {t('downloadTitle')}
        </Text>

        <div className={s.grid}>
          {platforms.map(({ id, icon, href }) => (
            <LinkCard key={id} hint={tIncy(`downloads.${id}`)} href={href} icon={icon} label={tIncy(`platforms.${id}`)} />
          ))}
        </div>
      </section>

      <section>
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
      </section>

      <section>
        <Text as='h2' className={s.sectionTitle}>
          {t('other.title')}
        </Text>

        <OtherClients />
      </section>
    </main>
  );
};

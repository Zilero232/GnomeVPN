import { useTranslations } from 'next-intl';

import { Text } from '@/ui-kit';

import { Comparison, Faq, Features, Guarantee, Hero, HowItWorks, Locations, Platforms } from './components';

import s from './LandingPage.module.scss';

export const LandingPage = () => {
  const t = useTranslations('landing');

  return (
    <main className={s.root}>
      <Hero />

      <section aria-labelledby='how-title' className={s.section} id='how'>
        <Text as='h2' className={s.sectionTitle} id='how-title'>
          {t('how.title')}
        </Text>
        <HowItWorks />
      </section>

      <section aria-labelledby='features-title' className={s.section} id='features'>
        <Text as='h2' className={s.sectionTitle} id='features-title'>
          {t('features.title')}
        </Text>
        <Features />
      </section>

      <section aria-labelledby='locations-title' className={s.section} id='locations'>
        <Text as='h2' className={s.sectionTitle} id='locations-title'>
          {t('locations.title')}
        </Text>
        <Locations />
      </section>

      <section aria-labelledby='compare-title' className={s.section} id='compare'>
        <Text as='h2' className={s.sectionTitle} id='compare-title'>
          {t('comparison.title')}
        </Text>
        <Comparison />
      </section>

      <section aria-labelledby='platforms-title' className={s.section} id='platforms'>
        <Text as='h2' className={s.sectionTitle} id='platforms-title'>
          {t('platforms.title')}
        </Text>
        <Platforms />
      </section>

      <section className={s.section}>
        <Guarantee />
      </section>

      <section aria-labelledby='faq-title' className={s.section} id='faq'>
        <Text as='h2' className={s.sectionTitle} id='faq-title'>
          {t('faq.title')}
        </Text>
        <Faq />
      </section>
    </main>
  );
};

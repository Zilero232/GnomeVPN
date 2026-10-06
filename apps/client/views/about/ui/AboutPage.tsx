import { useTranslations } from 'next-intl';

import { ABOUT_FACTS, ABOUT_SECTIONS } from '@/entities/app/about';
import { Text } from '@/ui-kit';

import s from './AboutPage.module.scss';

export const AboutPage = () => {
  const t = useTranslations('about');

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

      <dl className={s.facts}>
        {ABOUT_FACTS.map((fact) => (
          <div key={fact} className={s.fact}>
            <dt className={s.factLabel}>{t(`facts.${fact}.label`)}</dt>
            <dd className={s.factValue}>{t(`facts.${fact}.value`)}</dd>
          </div>
        ))}
      </dl>

      {ABOUT_SECTIONS.map((section) => (
        <section key={section} className={s.section}>
          <Text as='h2' className={s.heading}>
            {t(`sections.${section}.title`)}
          </Text>

          <Text as='p' className={s.body}>
            {t(`sections.${section}.body`)}
          </Text>
        </section>
      ))}
    </main>
  );
};

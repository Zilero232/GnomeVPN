'use client';

import { useTranslations } from 'next-intl';

import { SITE } from '@/shared/config';
import { faqJsonLd, JsonLd } from '@/shared/seo';
import { Accordion, Text } from '@/ui-kit';

import { FAQ_GROUPS } from '../config';

import s from './FaqPage.module.scss';

export const FaqPage = () => {
  const t = useTranslations('faq');

  const entries = FAQ_GROUPS.flatMap(({ questions }) =>
    questions.map((question) => ({ question: t(`questions.${question}.q`), answer: t(`questions.${question}.a`) }))
  );

  return (
    <main className={s.root}>
      <JsonLd data={faqJsonLd({ entries })} />

      <header className={s.head}>
        <Text as='h1' className={s.title}>
          {t('title')}
        </Text>

        <Text as='p' className={s.intro} tone='muted'>
          {t('intro')}
        </Text>
      </header>

      {FAQ_GROUPS.map(({ key, questions }) => (
        <section key={key} className={s.group}>
          <Text as='h2' className={s.groupTitle}>
            {t(`groups.${key}`)}
          </Text>

          <Accordion
            items={questions.map((question) => ({
              value: question,
              title: t(`questions.${question}.q`),
              content: t(`questions.${question}.a`)
            }))}
          />
        </section>
      ))}

      <footer className={s.footer}>
        <Text as='p' size='sm' tone='muted'>
          {t('stillStuck')}
        </Text>

        <a className={s.link} href={`mailto:${SITE.email}`}>
          {SITE.email}
        </a>
      </footer>
    </main>
  );
};

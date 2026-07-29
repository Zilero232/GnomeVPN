'use client';

import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';

import { LocaleSwitcher } from '@/features/app/switch-locale';
import { SITE } from '@/shared/config';
import { ROUTES } from '@/shared/constants';
import { BrandMark, Text } from '@/shared/ui';

import { PRIVACY_SECTIONS, PRIVACY_UPDATED } from '../config';

import s from './PrivacyPage.module.scss';

export const PrivacyPage = () => {
  const t = useTranslations('privacy');
  const format = useFormatter();

  return (
    <main className={s.root}>
      <article className={s.article}>
        <nav className={s.nav}>
          <Link className={s.brand} href={ROUTES.landing}>
            <BrandMark size='sm' />
          </Link>

          <LocaleSwitcher />
        </nav>

        <header className={s.head}>
          <Text as='h1' className={s.title}>
            {t('title')}
          </Text>
          <Text as='p' className={s.updated}>
            {t('updated', {
              date: format.dateTime(new Date(PRIVACY_UPDATED), { dateStyle: 'long' })
            })}
          </Text>
          <Text as='p' className={s.intro}>
            {t('intro')}
          </Text>
        </header>

        {PRIVACY_SECTIONS.map((section) => (
          <section key={section} className={s.section}>
            <Text as='h2' className={s.heading}>
              {t(`${section}.title`)}
            </Text>
            <Text as='p' className={s.body}>
              {t(`${section}.body`)}
            </Text>
          </section>
        ))}

        <footer className={s.footer}>
          <a className={s.link} href={`mailto:${SITE.email}`}>
            {SITE.email}
          </a>
        </footer>
      </article>
    </main>
  );
};

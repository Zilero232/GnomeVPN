'use client';

import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';

import { LocaleSwitcher } from '@/features/app/switch-locale';
import { SITE } from '@/shared/config';
import { ROUTES } from '@/shared/constants';
import { BrandMark } from '@/shared/ui';
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
            <BrandMark size="sm" />
          </Link>

          <LocaleSwitcher />
        </nav>

        <header className={s.head}>
          <h1 className={s.title}>{t('title')}</h1>
          <p className={s.updated}>
            {t('updated', {
              date: format.dateTime(new Date(PRIVACY_UPDATED), { dateStyle: 'long' }),
            })}
          </p>
          <p className={s.intro}>{t('intro')}</p>
        </header>

        {PRIVACY_SECTIONS.map((section) => (
          <section className={s.section} key={section}>
            <h2 className={s.heading}>{t(`${section}.title`)}</h2>
            <p className={s.body}>{t(`${section}.body`)}</p>
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

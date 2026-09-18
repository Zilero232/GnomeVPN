import { useTranslations } from 'next-intl';

import { SITE } from '@/shared/config';

import { FooterCopy } from './components';

import s from './SiteFooter.module.scss';

export const SiteFooter = () => {
  const t = useTranslations('footer');

  const buildYear = new Date().getFullYear();

  return (
    <footer className={s.root}>
      <div className={s.inner}>
        <FooterCopy buildYear={buildYear} className={s.copy} />

        <a className={s.link} href={`mailto:${SITE.email}`}>
          {t('support')}
        </a>
      </div>
    </footer>
  );
};

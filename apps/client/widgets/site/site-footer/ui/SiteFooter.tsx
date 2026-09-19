import { useTranslations } from 'next-intl';

import { SITE } from '@/shared/config';
import { FOOTER_NAV } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';

import { FooterCopy } from './components';

import s from './SiteFooter.module.scss';

export const SiteFooter = () => {
  const t = useTranslations('footer');

  const buildYear = new Date().getFullYear();

  return (
    <footer className={s.root}>
      <div className={s.inner}>
        <nav aria-label={t('ariaLabel')} className={s.nav}>
          {FOOTER_NAV.map(({ key, href }) => (
            <Link key={key} className={s.link} href={href}>
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className={s.meta}>
          <FooterCopy buildYear={buildYear} className={s.copy} />

          <a className={s.link} href={`mailto:${SITE.email}`}>
            {t('support')}
          </a>
        </div>
      </div>
    </footer>
  );
};

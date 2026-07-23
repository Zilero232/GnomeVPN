import { format } from 'date-fns';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { SITE } from '@/shared/config';
import { ROUTES } from '@/shared/constants';

import s from './LandingFooter.module.scss';

export const LandingFooter = () => {
  const t = useTranslations('landing.footer');

  const year = format(new Date(), 'yyyy');

  return (
    <footer className={s.root}>
      <div className={s.inner}>
        <span className={s.copy}>{t('copy', { name: SITE.name, year })}</span>

        <nav className={s.links}>
          <Link className={s.link} href={ROUTES.privacy}>
            {t('privacy')}
          </Link>

          <a className={s.link} href={`mailto:${SITE.email}`}>
            {t('support')}
          </a>
        </nav>
      </div>
    </footer>
  );
};

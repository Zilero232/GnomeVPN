import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

import { SITE } from '@/shared/config';
import { Link } from '@/shared/i18n/navigation';

import { FOOTER_LINKS } from '../config';

import s from './SiteFooter.module.scss';

export const SiteFooter = () => {
  const t = useTranslations('footer');

  const year = format(new Date(), 'yyyy');

  return (
    <footer className={s.root}>
      <div className={s.inner}>
        <span className={s.copy}>{t('copy', { name: SITE.name, year })}</span>

        <nav className={s.links}>
          {FOOTER_LINKS.map(({ key, href }) => (
            <Link key={key} className={s.link} href={href}>
              {t(key)}
            </Link>
          ))}

          <a className={s.link} href={`mailto:${SITE.email}`}>
            {t('support')}
          </a>
        </nav>
      </div>
    </footer>
  );
};

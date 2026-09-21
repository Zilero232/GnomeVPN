import { useTranslations } from 'next-intl';

import { Link } from '@/shared/i18n/navigation';
import { Text } from '@/ui-kit';

import type { RelatedLinksProps } from './RelatedLinks.types';

import s from './RelatedLinks.module.scss';

export const RelatedLinks = ({ links }: RelatedLinksProps) => {
  const t = useTranslations('common');

  return (
    <aside className={s.root}>
      <Text as='h2' className={s.title}>
        {t('relatedTitle')}
      </Text>

      <ul className={s.list}>
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link className={s.link} href={href}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

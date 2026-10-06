import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { buttonVariants, Text } from '@/ui-kit';

import s from './Guarantee.module.scss';

export const Guarantee = () => {
  const t = useTranslations('landing.guarantee');

  return (
    <div className={s.root}>
      <span aria-hidden className={s.icon}>
        <ShieldCheck size={22} strokeWidth={1.7} />
      </span>

      <div className={s.body}>
        <Text as='h2' className={s.title}>
          {t('title')}
        </Text>
        <Text as='p' className={s.text}>
          {t('body')}
        </Text>
      </div>

      <Link className={buttonVariants({ size: 'md', class: s.cta })} href={ROUTES.account}>
        {t('cta')}
      </Link>
    </div>
  );
};

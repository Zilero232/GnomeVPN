import { useTranslations } from 'next-intl';

import { ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { buttonVariants, StatusScreen } from '@/ui-kit';

export const NotFoundView = () => {
  const t = useTranslations('notFound');

  return (
    <StatusScreen body={t('body')} code={t('code')} title={t('title')}>
      <Link className={buttonVariants()} href={ROUTES.landing}>
        {t('home')}
      </Link>

      <Link className={buttonVariants({ variant: 'ghost' })} href={ROUTES.account}>
        {t('account')}
      </Link>
    </StatusScreen>
  );
};

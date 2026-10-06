import { useTranslations } from 'next-intl';

import { FAQ_HIGHLIGHTS } from '@/entities/app/faq';
import { ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { Text } from '@/ui-kit';

import s from './Faq.module.scss';

export const Faq = () => {
  const t = useTranslations('faq');
  const tLanding = useTranslations('landing.faq');

  return (
    <div className={s.list}>
      {FAQ_HIGHLIGHTS.map((question) => (
        <article key={question} className={s.item}>
          <Text as='h3' className={s.question}>
            {t(`questions.${question}.q`)}
          </Text>

          <Text as='p' className={s.answer}>
            {t(`questions.${question}.a`)}
          </Text>
        </article>
      ))}

      <div className={s.more}>
        <Link className={s.moreLink} href={ROUTES.faq}>
          {tLanding('more')}
        </Link>
      </div>
    </div>
  );
};

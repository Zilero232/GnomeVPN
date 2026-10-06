import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SITE } from '@/shared/config';
import { Text } from '@/ui-kit';

import { COMPARISON_ROWS } from '../../../config';

import s from './Comparison.module.scss';

export const Comparison = () => {
  const t = useTranslations('landing.comparison');

  return (
    <div aria-labelledby='compare-title' className={s.wrapper} role='table'>
      <div className={s.head} role='row'>
        <span role='columnheader'>
          <span className={s.srOnly}>{t('feature')}</span>
        </span>
        <span className={s.headUs} role='columnheader'>
          {SITE.name}
        </span>
        <span className={s.headThem} role='columnheader'>
          {t('free')}
        </span>
      </div>

      {COMPARISON_ROWS.map((row) => (
        <div key={row} className={s.row} role='row'>
          <div className={s.feature} role='rowheader'>
            <Text as='span' className={s.featureText}>
              {t(`${row}Label`)}
            </Text>
            <Text as='span' className={s.featureHint}>
              {t(`${row}Hint`)}
            </Text>
          </div>

          <div className={s.cell} role='cell'>
            <span className={s.yes}>
              <Check aria-hidden size={14} strokeWidth={3} />
              <span className={s.srOnly}>{t('yes')}</span>
            </span>
          </div>

          <div className={s.cell} role='cell'>
            <span className={s.no}>
              <X aria-hidden size={14} strokeWidth={3} />
              <span className={s.srOnly}>{t('no')}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

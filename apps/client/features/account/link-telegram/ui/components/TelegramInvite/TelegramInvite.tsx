import { Check, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, Text } from '@/ui-kit';

import type { TelegramInviteProps } from './TelegramInvite.types';

import { ABILITIES } from '../../../lib';

import s from './TelegramInvite.module.scss';

export const TelegramInvite = ({ isPending, isIssued, onConnect }: TelegramInviteProps) => {
  const t = useTranslations('telegram');

  return (
    <>
      <header className={s.head}>
        <Send aria-hidden className={s.headIcon} size={22} />

        <div className={s.headBody}>
          <Text as='h2' className={s.title}>
            {t('title')}
          </Text>

          <Text as='p' size='sm' tone='muted'>
            {t('intro')}
          </Text>
        </div>
      </header>

      <ul className={s.abilities}>
        {ABILITIES.map((ability) => (
          <li key={ability} className={s.ability}>
            <Check aria-hidden className={s.abilityCheck} size={14} />
            {t(`abilities.${ability}`)}
          </li>
        ))}
      </ul>

      {!isIssued && (
        <Button className={s.action} disabled={isPending} onClick={onConnect}>
          <Send aria-hidden size={16} />
          {t('connect')}
        </Button>
      )}
    </>
  );
};

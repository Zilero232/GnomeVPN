import { Check, ExternalLink, Unlink } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, Text } from '@/ui-kit';

import type { TelegramLinkedProps } from './TelegramLinked.types';

import { botLink } from '../../../lib';
import { ABILITIES } from './TelegramLinked.constants';

import s from './TelegramLinked.module.scss';

export const TelegramLinked = ({ bot, username, isPending, onUnlink }: TelegramLinkedProps) => {
  const t = useTranslations('telegram');

  return (
    <div className={s.root}>
      <div className={s.linked}>
        <Check aria-hidden className={s.check} size={18} />

        {username ? (
          <>
            <Text as='p' size='sm' tone='muted'>
              {t('linkedAs')}
            </Text>

            <span className={s.username}>@{username}</span>
          </>
        ) : (
          <Text as='p' size='sm'>
            {t('linkedPlain')}
          </Text>
        )}
      </div>

      <div className={s.abilities}>
        <Text className={s.abilitiesTitle} size='xs' tone='muted'>
          {t('linkedActions')}
        </Text>

        <ul className={s.list}>
          {ABILITIES.map((ability) => (
            <li key={ability} className={s.ability}>
              <Check aria-hidden className={s.abilityCheck} size={14} />
              {t(`abilities.${ability}`)}
            </li>
          ))}
        </ul>
      </div>

      <a className={s.openBot} href={botLink({ bot })} rel='noopener noreferrer' target='_blank'>
        {t('openBotLinked')}
        <ExternalLink aria-hidden size={15} />
      </a>

      <Text size='xs' tone='muted'>
        {t('linkedHint')}
      </Text>

      <div className={s.footer}>
        <Button disabled={isPending} variant='ghost' onClick={onUnlink}>
          <Unlink aria-hidden size={16} />
          {t('unlink')}
        </Button>

        <Text size='xs' tone='muted'>
          {t('unlinkHint')}
        </Text>
      </div>
    </div>
  );
};

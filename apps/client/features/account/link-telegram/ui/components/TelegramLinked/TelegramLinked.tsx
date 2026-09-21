import { Check, Unlink } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, Text } from '@/ui-kit';

import type { TelegramLinkedProps } from './TelegramLinked.types';

import s from './TelegramLinked.module.scss';

export const TelegramLinked = ({ username, isPending, onUnlink }: TelegramLinkedProps) => {
  const t = useTranslations('telegram');

  return (
    <div className={s.root}>
      <div className={s.linked}>
        <Check aria-hidden className={s.check} size={18} />

        <Text as='p' size='sm'>
          {username ? t('linkedAs', { username }) : t('linkedPlain')}
        </Text>
      </div>

      <Text size='xs' tone='muted'>
        {t('linkedHint')}
      </Text>

      <Button className={s.action} disabled={isPending} variant='ghost' onClick={onUnlink}>
        <Unlink aria-hidden size={16} />
        {t('unlink')}
      </Button>
    </div>
  );
};

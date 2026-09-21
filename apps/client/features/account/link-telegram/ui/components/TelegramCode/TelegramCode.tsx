import { Copy, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Text } from '@/ui-kit';

import type { TelegramCodeProps } from './TelegramCode.types';

import { botLink } from './TelegramCode.helpers';

import s from './TelegramCode.module.scss';

export const TelegramCode = ({ bot, code }: TelegramCodeProps) => {
  const t = useTranslations('telegram');

  const onCopy = async () => {
    await navigator.clipboard.writeText(code);

    toast.success(t('codeCopied'));
  };

  return (
    <div className={s.root}>
      <a className={s.openBot} href={botLink({ bot, code })} rel='noopener noreferrer' target='_blank'>
        <Send aria-hidden size={16} />
        {t('openBot')}
      </a>

      <Text className={s.waiting} size='xs' tone='muted'>
        {t('waiting')}
      </Text>

      <div className={s.manual}>
        <Text size='xs' tone='muted'>
          {t('manualHint', { bot })}
        </Text>

        <button className={s.codeValue} type='button' onClick={() => void onCopy()}>
          {code}
          <Copy aria-hidden size={14} />
        </button>
      </div>
    </div>
  );
};

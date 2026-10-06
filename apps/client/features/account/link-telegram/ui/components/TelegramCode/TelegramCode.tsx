import { Copy, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { buttonVariants, Text } from '@/ui-kit';

import type { TelegramCodeProps } from './TelegramCode.types';

import { botLink } from '../../../lib';

import s from './TelegramCode.module.scss';

export const TelegramCode = ({ bot, code }: TelegramCodeProps) => {
  const t = useTranslations('telegram');

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      toast.error(t('copyFailed'));

      return;
    }

    toast.success(t('codeCopied'));
  };

  return (
    <div className={s.root}>
      <a className={buttonVariants({ size: 'lg', class: s.openBot })} href={botLink({ bot, code })} rel='noopener noreferrer' target='_blank'>
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

        <button aria-label={t('copyCode', { code })} className={s.codeValue} type='button' onClick={() => void onCopy()}>
          {code}
          <Copy aria-hidden size={14} />
        </button>
      </div>
    </div>
  );
};

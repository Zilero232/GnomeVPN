'use client';

import { Check, ChevronDown, Link2, QrCode, RefreshCw, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { Button, Spinner, Text } from '@/ui-kit';

import type { CopyInput } from './IncyCard.types';

import { useRotateLink, useSubscriptionLink } from '../model/hooks';
import { IncyQrDialog, IncyRotateDialog, OtherAppsList } from './components';
import { COPIED_RESET_MS } from './IncyCard.constants';

import s from './IncyCard.module.scss';

export const IncyCard = () => {
  const t = useTranslations('incy');
  const { data: link, isLoading } = useSubscriptionLink();
  const rotate = useRotateLink();

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isRotateOpen, setIsRotateOpen] = useState(false);
  const [isOtherOpen, setIsOtherOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const onRotate = () => {
    rotate.mutate(undefined, { onSettled: () => setIsRotateOpen(false) });
  };

  const onCopy = async ({ value, message, id }: CopyInput) => {
    await navigator.clipboard.writeText(value);

    setCopied(id);
    toast.success(message);

    setTimeout(setCopied, COPIED_RESET_MS, null);
  };

  if (isLoading || !link) {
    return (
      <div className={s.loading}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className={s.root}>
      <div className={s.intro}>
        <Text as='h2' className={s.title}>
          {t('title')}
        </Text>

        <Text size='sm' tone='muted'>
          {t('hint')}
        </Text>

        <Link className={s.setupLink} href={ROUTES.setup}>
          {t('setupLink')}
        </Link>
      </div>

      <div className={s.actions}>
        <Button className={s.action} size='lg' onClick={() => void onCopy({ value: link.deepLink, message: t('deepLinkCopied'), id: 'incy' })}>
          {copied === 'incy' ? <Check aria-hidden size={16} /> : <Smartphone aria-hidden size={16} />}
          {t('copyDeepLink')}
        </Button>

        <Button className={s.action} size='lg' variant='ghost' onClick={() => void onCopy({ value: link.url, message: t('urlCopied'), id: 'url' })}>
          {copied === 'url' ? <Check aria-hidden size={16} /> : <Link2 aria-hidden size={16} />}
          {t('copyUrl')}
        </Button>

        <Button className={s.action} size='lg' variant='ghost' onClick={() => setIsQrOpen(true)}>
          <QrCode aria-hidden size={16} />
          {t('showQr')}
        </Button>
      </div>

      <div className={s.other}>
        <button aria-expanded={isOtherOpen} className={s.otherToggle} type='button' onClick={() => setIsOtherOpen((open) => !open)}>
          <ChevronDown aria-hidden className={s.chevron} data-open={isOtherOpen} size={16} />
          {t('otherApps')}
        </button>

        {isOtherOpen && <OtherAppsList clients={link.clients} url={link.url} onCopy={onCopy} />}
      </div>

      <div className={s.rotate}>
        <Text size='xs' tone='muted'>
          {t('rotateHint')}
        </Text>

        <Button className={s.rotateButton} disabled={rotate.isPending} variant='ghost' onClick={() => setIsRotateOpen(true)}>
          <RefreshCw aria-hidden size={14} />
          {t('rotate')}
        </Button>
      </div>

      <IncyQrDialog deepLink={link.deepLink} isOpen={isQrOpen} url={link.url} onOpenChange={setIsQrOpen} />

      <IncyRotateDialog isOpen={isRotateOpen} isPending={rotate.isPending} onConfirm={onRotate} onOpenChange={setIsRotateOpen} />
    </div>
  );
};

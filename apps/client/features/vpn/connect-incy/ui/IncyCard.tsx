'use client';

import { QrCode, RefreshCw, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { Button, Spinner, Text } from '@/ui-kit';

import { useRotateLink, useSubscriptionLink } from '../model/hooks';
import { IncyQrDialog } from './components/IncyQrDialog';

import s from './IncyCard.module.scss';

export const IncyCard = () => {
  const t = useTranslations('incy');
  const { data: link, isLoading } = useSubscriptionLink();
  const rotate = useRotateLink();

  const [isQrOpen, setIsQrOpen] = useState(false);

  const onCopy = async (value: string, message: string) => {
    await navigator.clipboard.writeText(value);

    toast.success(message);
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
        <Button onClick={() => void onCopy(link.deepLink, t('deepLinkCopied'))}>
          <Smartphone aria-hidden size={16} />
          {t('copyDeepLink')}
        </Button>

        <Button variant='ghost' onClick={() => setIsQrOpen(true)}>
          <QrCode aria-hidden size={16} />
          {t('showQr')}
        </Button>
      </div>

      <div className={s.rotate}>
        <Text className={s.rotateHint} size='xs' tone='muted'>
          {t('rotateHint')}
        </Text>

        <Button className={s.rotateButton} disabled={rotate.isPending} variant='ghost' onClick={() => rotate.mutate()}>
          <RefreshCw aria-hidden size={14} />
          {t('rotate')}
        </Button>
      </div>

      <IncyQrDialog isOpen={isQrOpen} value={link.deepLink} onOpenChange={setIsQrOpen} />
    </div>
  );
};

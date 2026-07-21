'use client';

import { Download, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import prettyBytes from 'pretty-bytes';
import { toast } from 'sonner';

import { env } from '@/shared/config';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';
import { useInstallUpdate } from '../../../model/hooks';

import s from './UpdateDialog.module.scss';

import type { UpdateDialogProps } from './UpdateDialog.types';

export const UpdateDialog = ({ isOpen, onOpenChange, update }: UpdateDialogProps) => {
  const t = useTranslations('update');
  const { isPending, mutate, progress } = useInstallUpdate();

  const percent =
    progress.totalBytes && progress.totalBytes > 0
      ? Math.min(100, Math.round((progress.downloadedBytes / progress.totalBytes) * 100))
      : null;

  const onInstall = () => {
    mutate(undefined, {
      onError: () => toast.error(t('installFailed')),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className={s.badge}>
            <Sparkles size={16} />
          </div>

          <DialogTitle>{t('availableTitle')}</DialogTitle>
          <DialogDescription>
            {t('availableDescription', { version: update.version })}
          </DialogDescription>
        </DialogHeader>

        <div className={s.versions}>
          <span>{t('currentVersion', { version: env.NEXT_PUBLIC_APP_VERSION })}</span>
        </div>

        {isPending && (
          <div className={s.progress}>
            <div className={s.progressHead}>
              <span>{percent === null ? t('installing') : t('downloading')}</span>

              {percent !== null && (
                <span className={s.progressValue}>
                  {progress.totalBytes && <span>{prettyBytes(progress.downloadedBytes)}</span>}
                  <span>{percent}%</span>
                </span>
              )}
            </div>

            <div className={s.track}>
              <div
                className={percent === null ? s.barIndeterminate : s.bar}
                style={percent === null ? undefined : { transform: `scaleX(${percent / 100})` }}
              />
            </div>
          </div>
        )}

        <div className={s.actions}>
          {!isPending && (
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('later')}
            </Button>
          )}

          <Button disabled={isPending} type="button" onClick={onInstall}>
            <Download size={15} />
            {isPending ? t('installing') : t('install')}
          </Button>
        </div>

        <p className={s.note}>{t('restartNote')}</p>
      </DialogContent>
    </Dialog>
  );
};

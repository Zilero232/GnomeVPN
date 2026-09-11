'use client';

import { Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { logger, pickExecutable } from '@/shared/lib';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Tabs } from '@/shared/ui';

import type { SplitTunnelingDialogProps } from './SplitTunnelingDialog.types';

import { useSplitTunnelingContext } from '../../model/context';
import { AddressSection, AppSection } from './components';

import s from './SplitTunnelingDialog.module.scss';

export const SplitTunnelingDialog = ({ isConnected, isOpen, onOpenChange }: SplitTunnelingDialogProps) => {
  const t = useTranslations('splitTunneling');
  const { draft, isApplying, isDirty, toggleApp, clear, apply } = useSplitTunnelingContext();

  const appsTotal = draft.apps.length;
  const ipsTotal = draft.ips.length;
  const total = appsTotal + ipsTotal;

  const pick = async () => {
    try {
      const path = await pickExecutable();

      if (path) {
        toggleApp(path);
      }
    } catch (error) {
      logger.warn(`cannot pick executable: ${String(error)}`);
    }
  };

  const submit = async () => {
    if (await apply()) {
      onOpenChange(false);

      return;
    }

    toast.error(t('applyFailed'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={s.dialog}>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <Tabs
          items={[
            {
              value: 'apps',
              label: (
                <span className={s.tab}>
                  {t('tabApps')}
                  {appsTotal > 0 && <Badge tone='accent'>{appsTotal}</Badge>}
                </span>
              ),
              content: <AppSection isOpen={isOpen} onPick={pick} />
            },
            {
              value: 'addresses',
              label: (
                <span className={s.tab}>
                  {t('tabAddresses')}
                  {ipsTotal > 0 && <Badge tone='accent'>{ipsTotal}</Badge>}
                </span>
              ),
              content: <AddressSection />
            }
          ]}
        />

        {isDirty && isConnected && (
          <p className={s.warning} role='status'>
            <Loader2 aria-hidden size={13} />
            {t('reconnectWarning')}
          </p>
        )}

        <div className={s.footer}>
          <div className={s.actions}>
            <button className={s.reset} disabled={total === 0 || isApplying} type='button' onClick={clear}>
              {t('clear')}
            </button>

            <Button disabled={!isDirty || isApplying} type='button' onClick={submit}>
              {isApplying ? <Loader2 aria-hidden className={s.spinner} size={14} /> : <Check aria-hidden size={14} />}
              {isApplying ? t('applying') : t('apply')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

'use client';

import { DEFAULT_DEVICE_LIMIT, extraDevicesPriceRub } from '@gnomevpn/schemas';
import { MonitorSmartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/shared/ui';

import type { ExtraDevicesControlProps, SlotState } from './ExtraDevicesControl.types';

import { useBuyExtraDevices } from '../../../model/hooks';

import s from './ExtraDevicesControl.module.scss';

export const ExtraDevicesControl = ({ limits }: ExtraDevicesControlProps) => {
  const t = useTranslations('account');
  const buy = useBuyExtraDevices();
  const [quantity, setQuantity] = useState(1);

  const remaining = limits.maxExtraDevices - limits.extraDevices;
  const pending = remaining > 0 ? quantity : 0;
  const slots = Array.from({ length: limits.maxExtraDevices + DEFAULT_DEVICE_LIMIT });

  const stateOf = (index: number): SlotState => {
    if (index < limits.deviceLimit) {
      return 'owned';
    }

    return index < limits.deviceLimit + pending ? 'pending' : 'empty';
  };

  return (
    <section className={s.root}>
      <header className={s.head}>
        <span className={s.icon}>
          <MonitorSmartphone size={15} />
        </span>

        <div className={s.headText}>
          <span className={s.title}>{t('extraDevicesTitle')}</span>

          <span className={s.count}>{t('extraDevicesCount', { limit: limits.deviceLimit })}</span>
        </div>
      </header>

      <div aria-hidden className={s.slots}>
        {slots.map((_, index) => (
          <span key={`slot-${String(index)}`} className={s.slot} data-state={stateOf(index)} />
        ))}
      </div>

      {remaining <= 0 ? (
        <p className={s.note}>{t('extraDevicesMaxed', { limit: limits.deviceLimit })}</p>
      ) : (
        <>
          <p className={s.note}>{t('extraDevicesHint', { price: limits.pricePerDeviceRub })}</p>

          <div className={s.actions}>
            <div className={s.stepper}>
              <button
                aria-label={t('extraDevicesLess')}
                className={s.step}
                disabled={quantity <= 1 || buy.isPending}
                type='button'
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                −
              </button>

              <span className={s.quantity}>{quantity}</span>

              <button
                aria-label={t('extraDevicesMore')}
                className={s.step}
                disabled={quantity >= remaining || buy.isPending}
                type='button'
                onClick={() => setQuantity((value) => Math.min(remaining, value + 1))}
              >
                +
              </button>
            </div>

            <Button disabled={buy.isPending} size='md' onClick={() => buy.mutate(quantity)}>
              {t('extraDevicesBuy', { price: extraDevicesPriceRub(quantity) })}
            </Button>
          </div>

          <p className={s.result}>{t('extraDevicesResult', { total: limits.deviceLimit + quantity })}</p>
        </>
      )}
    </section>
  );
};

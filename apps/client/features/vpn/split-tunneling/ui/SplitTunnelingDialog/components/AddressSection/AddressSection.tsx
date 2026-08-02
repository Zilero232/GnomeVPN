'use client';

import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { isEmpty } from 'remeda';

import { Button, IconButton, Input } from '@/shared/ui';

import type { AddressSectionProps } from './AddressSection.types';

import { SplitModeToggle } from '../SplitModeToggle';

import s from './AddressSection.module.scss';

export const AddressSection = ({ draft, setIpsMode, addIp, removeIp }: AddressSectionProps) => {
  const t = useTranslations('splitTunneling');

  const [ipValue, setIpValue] = useState('');

  const commitIp = () => {
    const value = ipValue.trim();

    if (!value) {
      return;
    }

    addIp(value);
    setIpValue('');
  };

  return (
    <div className={s.section}>
      <SplitModeToggle label={t('addressModeLabel')} lead={t('modeLeadAddresses')} mode={draft.ipsMode} onModeChange={setIpsMode} />

      <div className={s.ipRow}>
        <Input
          aria-label={t('ipPlaceholder')}
          placeholder={t('ipPlaceholder')}
          value={ipValue}
          onChange={(event) => setIpValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitIp();
            }
          }}
        />

        <Button disabled={!ipValue.trim()} type='button' variant='ghost' onClick={commitIp}>
          <Plus aria-hidden size={14} />
          {t('addIp')}
        </Button>
      </div>

      {!isEmpty(draft.ips) && (
        <div className={s.ipList}>
          {draft.ips.map((cidr) => (
            <span key={cidr} className={s.ipChip} data-mode={draft.ipsMode}>
              <span className={s.ipCidr}>{cidr}</span>

              <IconButton aria-label={t('removeIp')} size='sm' onClick={() => removeIp(cidr)}>
                <X size={12} />
              </IconButton>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

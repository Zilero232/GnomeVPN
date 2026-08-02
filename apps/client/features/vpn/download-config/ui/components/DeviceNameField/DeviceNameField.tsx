'use client';

import { ListChecks, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { CUSTOM_DEVICE_PRESET, DEVICE_PRESETS } from '@/entities/vpn/device';
import { IconButton, Input, Select } from '@/shared/ui';

import type { DeviceNameFieldProps } from './DeviceNameField.types';

import { DEVICE_ICON } from '../../../config';

import s from './DeviceNameField.module.scss';

export const DeviceNameField = ({ value, takenNames, isDisabled, onChange }: DeviceNameFieldProps) => {
  const t = useTranslations('configs');

  const presetNames = DEVICE_PRESETS.map((preset) => t(`devices.${preset.id}`));
  const [isCustom, setIsCustom] = useState(() => Boolean(value) && !presetNames.includes(value));

  const options = [
    ...DEVICE_PRESETS.map((preset) => {
      const label = t(`devices.${preset.id}`);
      const Icon = DEVICE_ICON[preset.icon];

      return {
        value: label,
        isDisabled: takenNames.includes(label),
        title: takenNames.includes(label) ? t('deviceTaken') : undefined,
        label: (
          <span className={s.option}>
            <Icon aria-hidden size={15} />
            {label}
          </span>
        )
      };
    }),
    {
      value: CUSTOM_DEVICE_PRESET,
      label: (
        <span className={s.option}>
          <Pencil aria-hidden size={15} />
          {t('deviceCustom')}
        </span>
      )
    }
  ];

  const handleSelect = (next: string) => {
    if (next === CUSTOM_DEVICE_PRESET) {
      setIsCustom(true);
      onChange('');

      return;
    }

    setIsCustom(false);
    onChange(next);
  };

  if (isCustom) {
    return (
      <span className={s.custom}>
        <Input
          disabled={isDisabled}
          id='config-name'
          placeholder={t('namePlaceholder')}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />

        <IconButton
          aria-label={t('devicePresets')}
          disabled={isDisabled}
          title={t('devicePresets')}
          tone='muted'
          type='button'
          onClick={() => {
            setIsCustom(false);
            onChange('');
          }}
        >
          <ListChecks aria-hidden size={15} />
        </IconButton>
      </span>
    );
  }

  return (
    <Select id='config-name' isDisabled={isDisabled} options={options} placeholder={t('devicePlaceholder')} value={value} onChange={handleSelect} />
  );
};

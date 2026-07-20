'use client';

import { Select as BaseSelect } from '@base-ui-components/react/select';
import { clsx } from 'clsx';
import { Check, ChevronDown } from 'lucide-react';
import { isNullish } from 'remeda';

import s from './Select.module.scss';

import type { SelectProps } from './Select.types';

export const Select = ({
  value,
  options,
  id,
  placeholder,
  isDisabled,
  className,
  'aria-label': ariaLabel,
  onChange,
}: SelectProps) => {
  const handleChange = (next: unknown) => {
    if (isNullish(next) || next === '') {
      return;
    }

    onChange(String(next));
  };

  return (
    <BaseSelect.Root disabled={isDisabled} value={value} onValueChange={handleChange}>
      <BaseSelect.Trigger aria-label={ariaLabel} className={clsx(s.trigger, className)} id={id}>
        <BaseSelect.Value className={s.value}>
          {(selected: string | null) =>
            options.find((option) => option.value === selected)?.label ?? placeholder
          }
        </BaseSelect.Value>

        <ChevronDown aria-hidden className={s.chevron} size={16} />
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        <BaseSelect.Positioner alignItemWithTrigger={false} className={s.positioner} sideOffset={4}>
          <BaseSelect.Popup className={s.popup}>
            <BaseSelect.List className={s.list}>
              {options.map((option) => (
                <BaseSelect.Item
                  className={s.item}
                  disabled={option.isDisabled}
                  key={option.value}
                  value={option.value}
                >
                  <BaseSelect.ItemText className={s.itemLabel}>{option.label}</BaseSelect.ItemText>

                  <BaseSelect.ItemIndicator className={s.check}>
                    <Check aria-hidden size={14} />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
};

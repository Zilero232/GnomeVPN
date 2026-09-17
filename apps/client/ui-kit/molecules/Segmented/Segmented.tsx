'use client';

import type { CSSProperties, KeyboardEvent } from 'react';

import { useResizeObserver } from '@siberiacancode/reactuse';
import { clsx } from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';
import { isNullish } from 'remeda';
import { match } from 'ts-pattern';

import type { SegmentedProps } from './Segmented.types';

import s from './Segmented.module.scss';

const PREVIOUS_KEYS = ['ArrowLeft', 'ArrowUp'];
const NEXT_KEYS = ['ArrowRight', 'ArrowDown'];

export const Segmented = <T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  indicatorTone = 'accent',
  className,
  'aria-label': ariaLabel
}: SegmentedProps<T>) => {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ width: 0, offset: 0 });

  const count = options.length;
  const activeIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0
  );

  const measure = () => {
    const active = buttonsRef.current[activeIndex];

    if (!active) {
      return;
    }

    setIndicator({ width: active.offsetWidth, offset: active.offsetLeft });
  };

  const { ref: rootRef } = useResizeObserver<HTMLDivElement>(measure);

  // eslint-disable-next-line react/exhaustive-deps -- measure reads live layout for the active option; value and options are its real inputs
  useLayoutEffect(measure, [value, options]);

  const style = {
    '--segment-width': `${indicator.width}px`,
    '--segment-offset': `${indicator.offset}px`
  } as CSSProperties;

  const focusOption = (index: number) => {
    const target = options[(index + count) % count];

    onChange(target.value);
    buttonsRef.current[(index + count) % count]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const nextIndex = match(event.key)
      .when(
        (key) => PREVIOUS_KEYS.includes(key),
        () => activeIndex - 1
      )
      .when(
        (key) => NEXT_KEYS.includes(key),
        () => activeIndex + 1
      )
      .with('Home', () => 0)
      .with('End', () => count - 1)
      .otherwise(() => null);

    if (isNullish(nextIndex)) {
      return;
    }

    event.preventDefault();
    focusOption(nextIndex);
  };

  return (
    <div
      ref={rootRef}
      aria-label={ariaLabel}
      className={clsx(s.root, className)}
      data-ready={indicator.width > 0}
      data-size={size}
      role='radiogroup'
      style={style}
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => {
        const isActive = option.value === value;

        return (
          // a native radio cannot host the sliding indicator and per-option icons; this follows the ARIA radiogroup pattern with roving tabindex
          <button
            key={option.value}
            ref={(node) => {
              buttonsRef.current[index] = node;
            }}
            aria-checked={isActive}
            aria-label={option['aria-label']}
            className={s.option}
            data-active={isActive}
            role='radio'
            tabIndex={isActive ? 0 : -1}
            type='button'
            onClick={() => onChange(option.value)}
          >
            {option.icon && <span aria-hidden>{option.icon}</span>}
            {option.label}
          </button>
        );
      })}

      <span className={s.indicator} data-tone={indicatorTone} />
    </div>
  );
};

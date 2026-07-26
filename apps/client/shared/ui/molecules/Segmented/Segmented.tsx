'use client';

import { useResizeObserver } from '@siberiacancode/reactuse';
import { clsx } from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';
import { match } from 'ts-pattern';

import s from './Segmented.module.scss';

import type { CSSProperties, KeyboardEvent } from 'react';
import type { SegmentedProps } from './Segmented.types';

const PREVIOUS_KEYS = ['ArrowLeft', 'ArrowUp'];
const NEXT_KEYS = ['ArrowRight', 'ArrowDown'];

export const Segmented = <T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  indicatorTone = 'accent',
  className,
  'aria-label': ariaLabel,
}: SegmentedProps<T>) => {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ width: 0, offset: 0 });

  const count = options.length;
  const activeIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );

  const measure = () => {
    const active = buttonsRef.current[activeIndex];

    if (!active) {
      return;
    }

    setIndicator({ width: active.offsetWidth, offset: active.offsetLeft });
  };

  const { ref: rootRef } = useResizeObserver<HTMLDivElement>(measure);

  // biome-ignore lint/correctness/useExhaustiveDependencies: measure reads live layout for the active option; value and options are its real inputs
  useLayoutEffect(measure, [value, options]);

  const style = {
    '--segment-width': `${indicator.width}px`,
    '--segment-offset': `${indicator.offset}px`,
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
        () => activeIndex - 1,
      )
      .when(
        (key) => NEXT_KEYS.includes(key),
        () => activeIndex + 1,
      )
      .with('Home', () => 0)
      .with('End', () => count - 1)
      .otherwise(() => null);

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    focusOption(nextIndex);
  };

  return (
    <div
      aria-label={ariaLabel}
      className={clsx(s.root, className)}
      data-ready={indicator.width > 0}
      data-size={size}
      ref={rootRef}
      role="radiogroup"
      style={style}
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => {
        const isActive = option.value === value;

        return (
          // biome-ignore lint/a11y/useSemanticElements: a native radio cannot host the sliding indicator and per-option icons; this follows the ARIA radiogroup pattern with roving tabindex
          <button
            aria-checked={isActive}
            aria-label={option['aria-label']}
            className={s.option}
            data-active={isActive}
            key={option.value}
            ref={(node) => {
              buttonsRef.current[index] = node;
            }}
            role="radio"
            tabIndex={isActive ? 0 : -1}
            type="button"
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

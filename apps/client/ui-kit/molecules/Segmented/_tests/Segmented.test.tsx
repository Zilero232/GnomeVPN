import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { SegmentedOption } from '../Segmented.types';

import { Segmented } from '../Segmented';

type Speed = 'auto' | 'fast' | 'slow' | 'turbo';

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const OPTIONS: SegmentedOption<Speed>[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'fast', label: 'Fast' },
  { value: 'slow', label: 'Slow' }
];

const renderSegmented = (value: Speed, onChange = vi.fn()) => {
  render(<Segmented aria-label='Speed' options={OPTIONS} value={value} onChange={onChange} />);

  return onChange;
};

describe('Segmented', () => {
  it('renders a radiogroup of every option', () => {
    renderSegmented('auto');

    expect(screen.getByRole('radiogroup', { name: 'Speed' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('checks only the active option', () => {
    renderSegmented('fast');

    expect(screen.getByRole('radio', { name: 'Fast' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Auto' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'Slow' })).toHaveAttribute('aria-checked', 'false');
  });

  it('keeps only the active option in the tab order', () => {
    renderSegmented('fast');

    expect(screen.getByRole('radio', { name: 'Fast' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'Auto' })).toHaveAttribute('tabindex', '-1');
  });

  it('reports the clicked option', () => {
    const onChange = renderSegmented('auto');

    fireEvent.click(screen.getByRole('radio', { name: 'Slow' }));

    expect(onChange).toHaveBeenCalledWith('slow');
  });

  it('moves to the next option on ArrowRight', () => {
    const onChange = renderSegmented('auto');

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Auto' }), { key: 'ArrowRight' });

    expect(onChange).toHaveBeenCalledWith('fast');
  });

  it('moves to the previous option on ArrowLeft', () => {
    const onChange = renderSegmented('fast');

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Fast' }), { key: 'ArrowLeft' });

    expect(onChange).toHaveBeenCalledWith('auto');
  });

  it('wraps from the first option back to the last', () => {
    const onChange = renderSegmented('auto');

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Auto' }), { key: 'ArrowLeft' });

    expect(onChange).toHaveBeenCalledWith('slow');
  });

  it('wraps from the last option round to the first', () => {
    const onChange = renderSegmented('slow');

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Slow' }), { key: 'ArrowRight' });

    expect(onChange).toHaveBeenCalledWith('auto');
  });

  it('jumps to the first option on Home and the last on End', () => {
    const onChange = renderSegmented('fast');

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Fast' }), { key: 'Home' });

    expect(onChange).toHaveBeenCalledWith('auto');

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Fast' }), { key: 'End' });

    expect(onChange).toHaveBeenCalledWith('slow');
  });

  it('ignores keys it does not handle', () => {
    const onChange = renderSegmented('fast');

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Fast' }), { key: 'a' });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('checks no option when the value matches none of them', () => {
    render(<Segmented aria-label='Speed' options={OPTIONS} value='turbo' onChange={vi.fn()} />);

    screen.getAllByRole('radio').forEach((option) => {
      expect(option).toHaveAttribute('aria-checked', 'false');
      expect(option).toHaveAttribute('tabindex', '-1');
    });
  });

  it('steers the keyboard from the first option when the value matches none', () => {
    const onChange = vi.fn();

    render(<Segmented aria-label='Speed' options={OPTIONS} value='turbo' onChange={onChange} />);

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Auto' }), { key: 'ArrowRight' });

    expect(onChange).toHaveBeenCalledWith('fast');
  });

  it('prefers an option aria-label over its visible label', () => {
    render(
      <Segmented
        aria-label='Speed'
        options={[{ value: 'auto', 'aria-label': 'Automatic selection', label: 'Auto' }]}
        value='auto'
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole('radio', { name: 'Automatic selection' })).toBeInTheDocument();
  });

  it('renders every option as a plain button so none submits a form', () => {
    renderSegmented('auto');

    screen.getAllByRole('radio').forEach((option) => expect(option).toHaveAttribute('type', 'button'));
  });
});

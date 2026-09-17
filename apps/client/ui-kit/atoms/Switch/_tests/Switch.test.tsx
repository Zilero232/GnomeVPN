import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Switch } from '../Switch';

const getTrack = (container: HTMLElement) => container.firstElementChild!;

describe('Switch', () => {
  it('is decorative, so it exposes no role of its own', () => {
    const { container } = render(<Switch isChecked={false} />);

    expect(getTrack(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('paints the checked state differently from the unchecked one', () => {
    const { container, rerender } = render(<Switch isChecked={false} />);
    const unchecked = getTrack(container).className;

    rerender(<Switch isChecked />);

    const checked = getTrack(container).className;

    expect(checked).not.toBe(unchecked);
    unchecked.split(' ').forEach((token) => expect(checked).toContain(token));
  });

  it('returns to the unchecked class when the state goes back', () => {
    const { container, rerender } = render(<Switch isChecked />);
    const checked = getTrack(container).className;

    rerender(<Switch isChecked={false} />);

    const unchecked = getTrack(container).className;

    expect(unchecked).not.toBe(checked);

    rerender(<Switch isChecked />);

    expect(getTrack(container).className).toBe(checked);
  });

  it('merges a custom className with the state classes', () => {
    const { container, rerender } = render(<Switch isChecked />);
    const base = getTrack(container).className;

    rerender(<Switch isChecked className='custom' />);

    const merged = getTrack(container).className;

    expect(merged).toContain('custom');
    base.split(' ').forEach((token) => expect(merged).toContain(token));
  });
});

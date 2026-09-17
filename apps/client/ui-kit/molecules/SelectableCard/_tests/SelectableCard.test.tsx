import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SelectableCard } from '../SelectableCard';

describe('SelectableCard', () => {
  it('renders its children', () => {
    render(<SelectableCard>Germany</SelectableCard>);

    expect(screen.getByRole('button', { name: 'Germany' })).toBeInTheDocument();
  });

  it('reports itself as unpressed by default', () => {
    render(<SelectableCard>Germany</SelectableCard>);

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports itself as pressed when selected', () => {
    render(<SelectableCard isSelected>Germany</SelectableCard>);

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('paints the selected state differently', () => {
    const { rerender } = render(<SelectableCard>Germany</SelectableCard>);
    const idle = screen.getByRole('button').className;

    rerender(<SelectableCard isSelected>Germany</SelectableCard>);

    const selected = screen.getByRole('button').className;

    expect(selected).not.toBe(idle);
    idle.split(' ').forEach((token) => expect(selected).toContain(token));
  });

  it('gives every size its own class', () => {
    const { rerender } = render(<SelectableCard size='sm'>Germany</SelectableCard>);
    const sm = screen.getByRole('button').className;

    rerender(<SelectableCard size='md'>Germany</SelectableCard>);
    const md = screen.getByRole('button').className;

    rerender(<SelectableCard size='lg'>Germany</SelectableCard>);
    const lg = screen.getByRole('button').className;

    expect(new Set([sm, md, lg]).size).toBe(3);
  });

  it('defaults to type="button"', () => {
    render(<SelectableCard>Germany</SelectableCard>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('fires onClick', () => {
    const onClick = vi.fn();

    render(<SelectableCard onClick={onClick}>Germany</SelectableCard>);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();

    render(
      <SelectableCard disabled onClick={onClick}>
        Germany
      </SelectableCard>
    );

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });
});

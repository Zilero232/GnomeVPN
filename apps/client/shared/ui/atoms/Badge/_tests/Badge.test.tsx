import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Active</Badge>);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('defaults to the accent tone', () => {
    const { rerender } = render(<Badge>Active</Badge>);
    const fallback = screen.getByText('Active').className;

    rerender(<Badge tone='accent'>Active</Badge>);

    expect(screen.getByText('Active').className).toBe(fallback);
  });

  it('gives the muted tone a class of its own', () => {
    const { rerender } = render(<Badge tone='accent'>Active</Badge>);
    const accent = screen.getByText('Active').className;

    rerender(<Badge tone='muted'>Active</Badge>);

    expect(screen.getByText('Active').className).not.toBe(accent);
  });

  it('merges a custom className with the tone classes', () => {
    const { rerender } = render(<Badge tone='muted'>Active</Badge>);
    const base = screen.getByText('Active').className;

    rerender(
      <Badge className='custom' tone='muted'>
        Active
      </Badge>
    );

    const merged = screen.getByText('Active').className;

    expect(merged).toContain('custom');
    base.split(' ').forEach((token) => expect(merged).toContain(token));
  });

  it('passes span attributes through', () => {
    render(<Badge title='status'>Active</Badge>);

    expect(screen.getByText('Active')).toHaveAttribute('title', 'status');
  });
});

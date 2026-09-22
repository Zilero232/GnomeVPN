import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusIcon } from '../StatusIcon';

describe('StatusIcon', () => {
  it('renders the icon it wraps', () => {
    render(
      <StatusIcon>
        <svg data-testid='icon' />
      </StatusIcon>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('hides itself from assistive technology, because the copy beside it carries the meaning', () => {
    const { container } = render(
      <StatusIcon>
        <svg />
      </StatusIcon>
    );

    expect(container.firstElementChild).toHaveAttribute('aria-hidden');
  });

  it('gives every tone its own class, so danger never reads as accent', () => {
    const classes = (['accent', 'danger', 'muted'] as const).map((tone) => {
      const { container, unmount } = render(
        <StatusIcon tone={tone}>
          <svg />
        </StatusIcon>
      );

      const { className } = container.firstElementChild as HTMLElement;

      unmount();

      return className;
    });

    expect(new Set(classes).size).toBe(classes.length);
  });
});

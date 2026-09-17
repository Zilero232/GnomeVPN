import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Banner } from '../Banner';

describe('Banner', () => {
  it('renders its title and description', () => {
    render(<Banner description='Your subscription renews tomorrow' icon={null} title='Heads up' tone='accent' />);

    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('Your subscription renews tomorrow')).toBeInTheDocument();
  });

  it('announces an accent banner politely as a status', () => {
    render(<Banner description='All good' icon={null} title='Heads up' tone='accent' />);

    const banner = screen.getByRole('status');

    expect(banner).toHaveAttribute('aria-live', 'polite');
    expect(banner).toHaveAttribute('data-tone', 'accent');
  });

  it('announces a danger banner assertively as an alert', () => {
    render(<Banner description='Payment failed' icon={null} title='Error' tone='danger' />);

    const banner = screen.getByRole('alert');

    expect(banner).toHaveAttribute('aria-live', 'assertive');
    expect(banner).toHaveAttribute('data-tone', 'danger');
  });

  it('treats a warning banner as an alert too', () => {
    render(<Banner description='Node is degraded' icon={null} title='Warning' tone='warning' />);

    const banner = screen.getByRole('alert');

    expect(banner).toHaveAttribute('aria-live', 'assertive');
    expect(banner).toHaveAttribute('data-tone', 'warning');
  });

  it('hides the icon from assistive technology', () => {
    render(<Banner description='All good' icon={<svg data-testid='icon' />} title='Heads up' tone='accent' />);

    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders no action slot when no action is given', () => {
    render(<Banner description='All good' icon={null} title='Heads up' tone='accent' />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the action when given one', () => {
    render(<Banner action={<button type='button'>Retry</button>} description='Payment failed' icon={null} title='Error' tone='danger' />);

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { PasswordInput } from '../PasswordInput';

const LABELS = { showLabel: 'Show password', hideLabel: 'Hide password' };

describe('PasswordInput', () => {
  it('starts masked', () => {
    render(<PasswordInput aria-label='Password' {...LABELS} />);

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('reveals the value on the first toggle and masks it again on the second', async () => {
    const user = userEvent.setup();

    render(<PasswordInput aria-label='Password' {...LABELS} />);

    const input = screen.getByLabelText('Password');

    await user.click(screen.getByRole('button', { name: LABELS.showLabel }));

    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: LABELS.hideLabel }));

    expect(input).toHaveAttribute('type', 'password');
  });

  it('swaps the toggle label with the visibility', async () => {
    const user = userEvent.setup();

    render(<PasswordInput aria-label='Password' {...LABELS} />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', LABELS.showLabel);

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', LABELS.hideLabel);
  });

  it('keeps the toggle out of the tab order', () => {
    render(<PasswordInput aria-label='Password' {...LABELS} />);

    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '-1');
  });

  it('is a plain button so it never submits its form', () => {
    render(<PasswordInput aria-label='Password' {...LABELS} />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('disables both the input and the toggle when disabled', () => {
    render(<PasswordInput disabled aria-label='Password' {...LABELS} />);

    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not reveal the value while disabled', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<PasswordInput disabled aria-label='Password' {...LABELS} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('keeps the typed value across a visibility toggle', async () => {
    const user = userEvent.setup();

    render(<PasswordInput aria-label='Password' {...LABELS} />);

    await user.type(screen.getByLabelText('Password'), 'hunter2');
    await user.click(screen.getByRole('button'));

    expect(screen.getByLabelText('Password')).toHaveValue('hunter2');
  });

  it('merges a custom className onto the input, not the wrapper', () => {
    render(<PasswordInput aria-label='Password' className='custom' {...LABELS} />);

    expect(screen.getByLabelText('Password')).toHaveClass('custom');
  });

  it('passes input attributes through', () => {
    render(<PasswordInput required aria-label='Password' autoComplete='new-password' name='password' {...LABELS} />);

    const input = screen.getByLabelText('Password');

    expect(input).toBeRequired();
    expect(input).toHaveAttribute('name', 'password');
    expect(input).toHaveAttribute('autocomplete', 'new-password');
  });
});

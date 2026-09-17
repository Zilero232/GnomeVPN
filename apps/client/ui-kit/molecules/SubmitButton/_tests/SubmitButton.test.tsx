import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SubmitButton } from '../SubmitButton';

const getSpinner = (button: HTMLElement) => button.firstElementChild!;

describe('SubmitButton', () => {
  it('renders its children', () => {
    render(<SubmitButton>Sign in</SubmitButton>);

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('defaults to type="submit"', () => {
    render(<SubmitButton>Sign in</SubmitButton>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('passes a custom type through', () => {
    render(<SubmitButton type='button'>Sign in</SubmitButton>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('is enabled by default', () => {
    render(<SubmitButton>Sign in</SubmitButton>);

    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('is disabled while pending', () => {
    render(<SubmitButton isPending>Sign in</SubmitButton>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled is passed', () => {
    render(<SubmitButton disabled>Sign in</SubmitButton>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('stays disabled while pending even when disabled is false', () => {
    render(
      <SubmitButton isPending disabled={false}>
        Sign in
      </SubmitButton>
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders the spinner wrapper and toggles its visibility class with isPending', () => {
    const { rerender } = render(<SubmitButton>Sign in</SubmitButton>);
    const idle = getSpinner(screen.getByRole('button'));

    expect(idle).toBeInTheDocument();

    const idleClass = idle.className;

    rerender(<SubmitButton isPending>Sign in</SubmitButton>);

    const pendingClass = getSpinner(screen.getByRole('button')).className;

    expect(pendingClass).not.toBe(idleClass);
    idleClass.split(' ').forEach((token) => expect(pendingClass).toContain(token));
  });

  it('does not fire onClick while pending', () => {
    const onClick = vi.fn();

    render(
      <SubmitButton isPending onClick={onClick}>
        Sign in
      </SubmitButton>
    );

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('merges a custom className with its own', () => {
    const { rerender } = render(<SubmitButton>Sign in</SubmitButton>);
    const base = screen.getByRole('button').className;

    rerender(<SubmitButton className='custom'>Sign in</SubmitButton>);

    const merged = screen.getByRole('button').className;

    expect(merged).toContain('custom');
    base.split(' ').forEach((token) => expect(merged).toContain(token));
  });
});

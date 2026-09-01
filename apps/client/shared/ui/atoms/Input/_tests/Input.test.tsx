import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Input } from '../Input';

describe('Input', () => {
  it('defaults to type="text"', () => {
    render(<Input aria-label='Email' />);

    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'text');
  });

  it('passes a custom type through', () => {
    render(<Input aria-label='Password' type='password' />);

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('renders a placeholder', () => {
    render(<Input placeholder='you@example.com' />);

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('renders a controlled value', () => {
    render(<Input aria-label='Email' value='alex@example.com' onChange={vi.fn()} />);

    expect(screen.getByLabelText('Email')).toHaveValue('alex@example.com');
  });

  it('reports what the user types', () => {
    const onChange = vi.fn();

    render(<Input aria-label='Email' onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'abc' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Email')).toHaveValue('abc');
  });

  it('is not editable when disabled', () => {
    render(<Input disabled aria-label='Email' />);

    const input = screen.getByLabelText('Email');

    expect(input).toBeDisabled();
    expect(input).toHaveValue('');
  });

  it('merges a custom className with its own', () => {
    const { rerender } = render(<Input aria-label='Email' />);
    const base = screen.getByLabelText('Email').className;

    rerender(<Input aria-label='Email' className='custom' />);

    const merged = screen.getByLabelText('Email').className;

    expect(merged).toContain('custom');
    base.split(' ').forEach((token) => expect(merged).toContain(token));
  });

  it('passes aria state through for the invalid case', () => {
    render(<Input aria-invalid aria-describedby='email-error' aria-label='Email' />);

    const input = screen.getByLabelText('Email');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
  });

  it('passes name, id and required through', () => {
    render(<Input required aria-label='Email' id='email' name='email' />);

    const input = screen.getByLabelText('Email');

    expect(input).toBeRequired();
    expect(input).toHaveAttribute('id', 'email');
    expect(input).toHaveAttribute('name', 'email');
  });
});

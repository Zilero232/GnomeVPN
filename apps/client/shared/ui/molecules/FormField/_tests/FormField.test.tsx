import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Input } from '../../../atoms';
import { FormField } from '../FormField';

describe('FormField', () => {
  it('renders its label', () => {
    render(
      <FormField htmlFor='email' label='Email'>
        <Input id='email' />
      </FormField>
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('associates the label with the control it names', () => {
    render(
      <FormField htmlFor='email' label='Email'>
        <Input id='email' />
      </FormField>
    );

    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'email');
  });

  it('renders its children', () => {
    render(
      <FormField htmlFor='email' label='Email'>
        <Input id='email' placeholder='you@example.com' />
      </FormField>
    );

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('renders no error by default', () => {
    render(
      <FormField htmlFor='email' label='Email'>
        <Input id='email' />
      </FormField>
    );

    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  it('renders an error message when given one', () => {
    render(
      <FormField error='Email is required' htmlFor='email' label='Email'>
        <Input id='email' />
      </FormField>
    );

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('renders a hint when there is no error', () => {
    render(
      <FormField hint='We never share it' htmlFor='email' label='Email'>
        <Input id='email' />
      </FormField>
    );

    expect(screen.getByText('We never share it')).toBeInTheDocument();
  });

  it('replaces the hint with the error when both are given', () => {
    render(
      <FormField error='Email is required' hint='We never share it' htmlFor='email' label='Email'>
        <Input id='email' />
      </FormField>
    );

    expect(screen.queryByText('We never share it')).not.toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('merges a custom className onto the root', () => {
    const { container, rerender } = render(
      <FormField htmlFor='email' label='Email'>
        <Input id='email' />
      </FormField>
    );

    const base = container.firstElementChild!.className;

    rerender(
      <FormField className='custom' htmlFor='email' label='Email'>
        <Input id='email' />
      </FormField>
    );

    const merged = container.firstElementChild!.className;

    expect(merged).toContain('custom');
    base.split(' ').forEach((token) => expect(merged).toContain(token));
  });

  it('marks the root differently when the error floats', () => {
    const { container, rerender } = render(
      <FormField htmlFor='email' label='Email'>
        <Input id='email' />
      </FormField>
    );

    const flat = container.firstElementChild!.className;

    rerender(
      <FormField hasFloatingError htmlFor='email' label='Email'>
        <Input id='email' />
      </FormField>
    );

    expect(container.firstElementChild!.className).not.toBe(flat);
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '../Button';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Connect</Button>);

    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('defaults to type="button" so it cannot submit a surrounding form', () => {
    render(<Button>Connect</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('does not submit the form it sits in', () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <Button>Connect</Button>
      </form>
    );

    fireEvent.click(screen.getByRole('button'));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('passes a custom type through', () => {
    render(<Button type='submit'>Save</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('gives every variant its own class', () => {
    const { rerender } = render(<Button variant='primary'>Go</Button>);
    const primary = screen.getByRole('button').className;

    rerender(<Button variant='ghost'>Go</Button>);
    const ghost = screen.getByRole('button').className;

    rerender(<Button variant='danger'>Go</Button>);
    const danger = screen.getByRole('button').className;

    expect(new Set([primary, ghost, danger]).size).toBe(3);
  });

  it('gives every size its own class', () => {
    const { rerender } = render(<Button size='md'>Go</Button>);
    const md = screen.getByRole('button').className;

    rerender(<Button size='lg'>Go</Button>);
    const lg = screen.getByRole('button').className;

    rerender(<Button size='icon'>Go</Button>);
    const icon = screen.getByRole('button').className;

    expect(new Set([md, lg, icon]).size).toBe(3);
  });

  it('defaults to the primary md variant', () => {
    const { rerender } = render(<Button>Go</Button>);
    const fallback = screen.getByRole('button').className;

    rerender(
      <Button size='md' variant='primary'>
        Go
      </Button>
    );

    expect(screen.getByRole('button').className).toBe(fallback);
  });

  it('merges a custom className instead of replacing the variant classes', () => {
    const { rerender } = render(<Button>Go</Button>);
    const base = screen.getByRole('button').className;

    rerender(<Button className='custom'>Go</Button>);

    const merged = screen.getByRole('button').className;

    expect(merged).toContain('custom');
    base.split(' ').forEach((token) => expect(merged).toContain(token));
  });

  it('fires onClick', () => {
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Go</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();

    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>
    );

    const button = screen.getByRole('button');

    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });
});

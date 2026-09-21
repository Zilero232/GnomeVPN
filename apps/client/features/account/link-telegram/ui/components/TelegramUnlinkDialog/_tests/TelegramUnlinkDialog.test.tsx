import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

const { TelegramUnlinkDialog } = await import('../TelegramUnlinkDialog');

const setup = (overrides: Partial<Parameters<typeof TelegramUnlinkDialog>[0]> = {}) => {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();

  render(<TelegramUnlinkDialog isOpen isPending={false} onConfirm={onConfirm} onOpenChange={onOpenChange} {...overrides} />);

  return { onConfirm, onOpenChange };
};

describe('TelegramUnlinkDialog', () => {
  it('renders nothing until it is opened, so a stray click cannot unlink', () => {
    setup({ isOpen: false });

    expect(screen.queryByText('unlinkConfirmTitle')).not.toBeInTheDocument();
  });

  it('names the consequence rather than only asking to confirm', () => {
    setup();

    expect(screen.getByText('unlinkConfirmTitle')).toBeInTheDocument();
    expect(screen.getByText('unlinkConfirmBody')).toBeInTheDocument();
  });

  it('unlinks only when the confirming button is pressed', async () => {
    const { onConfirm } = setup();

    expect(onConfirm).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'unlinkConfirmAction' }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('closes without unlinking when cancelled', async () => {
    const { onConfirm, onOpenChange } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'unlinkConfirmCancel' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables both buttons while the request is in flight, so it cannot be sent twice', () => {
    setup({ isPending: true });

    expect(screen.getByRole('button', { name: 'unlinkConfirmAction' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'unlinkConfirmCancel' })).toBeDisabled();
  });
});

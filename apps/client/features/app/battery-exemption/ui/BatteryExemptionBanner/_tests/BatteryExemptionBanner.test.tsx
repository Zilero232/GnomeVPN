import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const useBatteryExemption = vi.fn();

vi.mock('../../../model/hooks', () => ({ useBatteryExemption }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

const { BatteryExemptionBanner } = await import('../BatteryExemptionBanner');

const state = ({ isGranted = false, isRequesting = false, request = vi.fn() } = {}) => {
  useBatteryExemption.mockReturnValue({ isGranted, isRequesting, request });

  return request;
};

beforeEach(() => {
  useBatteryExemption.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BatteryExemptionBanner', () => {
  it('warns a connected user whose app is still battery-restricted', () => {
    state();

    render(<BatteryExemptionBanner isConnected />);

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('stays out of the way while the tunnel is off, since doze cannot break what is not running', () => {
    state();

    const { container } = render(<BatteryExemptionBanner isConnected={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing once the exemption has been granted', () => {
    state({ isGranted: true });

    const { container } = render(<BatteryExemptionBanner isConnected />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing when the exemption is granted and the tunnel is off', () => {
    state({ isGranted: true });

    const { container } = render(<BatteryExemptionBanner isConnected={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('asks for the exemption when the button is pressed', async () => {
    const request = state();
    const user = userEvent.setup();

    render(<BatteryExemptionBanner isConnected />);

    await user.click(screen.getByRole('button'));

    expect(request).toHaveBeenCalledOnce();
  });

  it('disables the button and says so while the settings screen opens', () => {
    state({ isRequesting: true });

    render(<BatteryExemptionBanner isConnected />);

    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('requesting');
  });

  it('offers the action again once the screen has opened', () => {
    state({ isRequesting: false });

    render(<BatteryExemptionBanner isConnected />);

    const button = screen.getByRole('button');

    expect(button).toBeEnabled();
    expect(button).toHaveTextContent('allow');
  });
});

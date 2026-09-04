import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const toastError = vi.fn();
const searchParams = new URLSearchParams();

vi.mock('sonner', () => ({ toast: { error: toastError } }));
vi.mock('next/navigation', () => ({ useSearchParams: () => searchParams }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => `translated:${key}` }));

const { useVerifyEmailOutcome } = await import('../use-verify-email-outcome');

const Probe = () => {
  useVerifyEmailOutcome();

  return null;
};

const withQuery = (query: string) => {
  searchParams.forEach((_, key) => searchParams.delete(key));

  for (const [key, value] of new URLSearchParams(query)) {
    searchParams.set(key, value);
  }
};

let replaceState: ReturnType<typeof vi.fn<(data: unknown, unused: string, url?: string | URL | null) => void>>;

beforeEach(() => {
  toastError.mockReset();
  replaceState = vi.fn<(data: unknown, unused: string, url?: string | URL | null) => void>();

  vi.spyOn(window.history, 'replaceState').mockImplementation(replaceState);
  window.history.replaceState(null, '', '/account');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useVerifyEmailOutcome', () => {
  it('stays silent when the link carried no error', () => {
    withQuery('');

    render(<Probe />);

    expect(toastError).not.toHaveBeenCalled();
  });

  it('surfaces an expired link instead of dropping the user into a silent account page', () => {
    withQuery('error=TOKEN_EXPIRED');

    render(<Probe />);

    expect(toastError).toHaveBeenCalledWith('translated:TOKEN_EXPIRED');
  });

  it('translates an unfamiliar code through the UNKNOWN message', () => {
    withQuery('error=SOMETHING_ELSE');

    render(<Probe />);

    expect(toastError).toHaveBeenCalledWith('translated:UNKNOWN');
  });

  it('strips the error from the url so a reload does not repeat it', () => {
    withQuery('error=INVALID_TOKEN');

    render(<Probe />);

    const [, , url] = replaceState.mock.calls.at(-1) ?? [];

    expect(url).not.toContain('error');
  });

  it('keeps the other query parameters when it cleans the url', () => {
    withQuery('error=INVALID_TOKEN&tab=profile');

    render(<Probe />);

    const [, , url] = replaceState.mock.calls.at(-1) ?? [];

    expect(url).toContain('tab=profile');
  });

  it('reports the error once, not on every render', () => {
    withQuery('error=TOKEN_EXPIRED');

    const view = render(<Probe />);

    view.rerender(<Probe />);
    view.rerender(<Probe />);

    expect(toastError).toHaveBeenCalledTimes(1);
  });
});

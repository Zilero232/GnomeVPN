import type { ApiCallFn } from 'grammy';

import { GrammyError, HttpError } from 'grammy';
import { describe, expect, it, vi } from 'vitest';

import { retryNetworkErrors } from '../network-retry';

const OK = { ok: true, result: true } as const;

describe('retryNetworkErrors', () => {
  it('retries a call that never reached Telegram', async () => {
    const prev = vi
      .fn()
      .mockRejectedValueOnce(new HttpError('Network request failed!', new Error('reset')))
      .mockResolvedValueOnce(OK);

    await expect(retryNetworkErrors(prev as ApiCallFn, 'sendMessage', { chat_id: 1, text: 'hi' })).resolves.toEqual(OK);
    expect(prev).toHaveBeenCalledTimes(2);
  });

  it('does not retry an answer Telegram gave', async () => {
    const refusal = new GrammyError(
      'Forbidden',
      { ok: false, error_code: 403, description: 'Forbidden: bot was blocked by the user' },
      'sendMessage',
      {}
    );

    const prev = vi.fn().mockRejectedValue(refusal);

    await expect(retryNetworkErrors(prev as ApiCallFn, 'sendMessage', { chat_id: 1, text: 'hi' })).rejects.toBe(refusal);
    expect(prev).toHaveBeenCalledTimes(1);
  });
});

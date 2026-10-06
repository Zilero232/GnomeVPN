import type { Transformer } from 'grammy';

import { HttpError } from 'grammy';
import pRetry from 'p-retry';

import { BOT_API } from '../../config';

export const retryNetworkErrors: Transformer = (prev, method, payload, signal) =>
  pRetry(() => prev(method, payload, signal), {
    retries: BOT_API.callRetries,
    minTimeout: BOT_API.callBackoffMs,
    shouldRetry: ({ error }) => error instanceof HttpError
  });

import type { WaitForDisconnectedInput } from './wait-for-disconnected.types';

import { DISCONNECT_POLL_MS, DISCONNECT_TIMEOUT_MS } from '../../config';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForDisconnected = async ({
  readStatus,
  pollMs = DISCONNECT_POLL_MS,
  timeoutMs = DISCONNECT_TIMEOUT_MS
}: WaitForDisconnectedInput): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if ((await readStatus()) === 'disconnected') {
      return true;
    }

    await sleep(pollMs);
  }

  return false;
};

export type WaitForDisconnectedInput = {
  readStatus: () => Promise<string>;
  pollMs?: number;
  timeoutMs?: number;
};

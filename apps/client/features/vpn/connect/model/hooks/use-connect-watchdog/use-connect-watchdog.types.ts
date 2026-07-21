export type StartWatchdogInput = {
  onTimeout: () => Promise<void>;
};

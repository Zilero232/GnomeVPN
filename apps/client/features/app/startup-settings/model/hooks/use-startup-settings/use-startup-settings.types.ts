export type UseStartupSettings = {
  autoStart: boolean;
  autoConnect: boolean;
  autoReconnect: boolean;
  isLoading: boolean;
  toggleAutoStart: (value: boolean) => Promise<void>;
  toggleAutoConnect: (value: boolean) => Promise<void>;
  toggleAutoReconnect: (value: boolean) => Promise<void>;
};

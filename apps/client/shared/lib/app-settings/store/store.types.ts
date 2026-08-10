import type { UnlistenFn } from '@tauri-apps/api/event';

export type Setting<TRead, TWrite = TRead> = {
  get: () => Promise<TRead>;
  set: (value: TWrite) => Promise<void>;
  subscribe: (listener: (value: TRead) => void) => Promise<UnlistenFn>;
};

export type SettingInput<TRead> = {
  key: string;
  fallback: TRead;
  parse?: (raw: unknown) => TRead;
};

import type { Setting } from '../store';

export type UseSettingInput<TRead, TWrite> = {
  initial: TRead;
  isEnabled?: boolean;
  setting: Setting<TRead, TWrite>;
};

export type UseSetting<TRead, TWrite> = {
  isLoading: boolean;
  value: TRead;
  write: (next: TWrite & TRead) => void;
};

import { platform } from '@tauri-apps/plugin-os';
import { match } from 'ts-pattern';

import { LINUX_SOUND, MACOS_SOUND, WINDOWS_SOUND } from '../config';

import type { NotifyTone } from '../model';

export const resolveSound = (tone: NotifyTone): string | undefined => {
  try {
    return match(platform())
      .with('windows', () => WINDOWS_SOUND[tone])
      .with('macos', () => MACOS_SOUND[tone])
      .with('linux', () => LINUX_SOUND[tone])
      .otherwise(() => undefined);
  } catch {
    return undefined;
  }
};

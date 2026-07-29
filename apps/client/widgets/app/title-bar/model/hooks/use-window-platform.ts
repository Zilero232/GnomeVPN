'use client';

import type { Platform } from '@tauri-apps/plugin-os';

import { useMount } from '@siberiacancode/reactuse';
import { platform } from '@tauri-apps/plugin-os';
import { useState } from 'react';

import { isTauriDesktop } from '@/shared/lib';

export const useWindowPlatform = () => {
  const [os, setOs] = useState<Platform | null>(null);

  useMount(() => {
    if (isTauriDesktop()) {
      setOs(platform());
    }
  });

  return os;
};

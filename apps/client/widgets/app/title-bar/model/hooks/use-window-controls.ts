'use client';

import { closeMainWindow, minimizeMainWindow } from '@/shared/lib';

export const useWindowControls = () => ({
  minimize: minimizeMainWindow,
  close: closeMainWindow
});

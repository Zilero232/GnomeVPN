'use client';

import { closeMainWindow, minimizeMainWindow } from '@/shared/lib';

export const useWindowControls = () => {
  return {
    minimize: minimizeMainWindow,
    close: closeMainWindow,
  };
};

'use client';

import { clsx } from 'clsx';

import { BrandMark } from '@/shared/ui';
import { useWindowControls, useWindowPlatform } from '../../model/hooks';
import { TitleBarControls } from './components';

import s from './TitleBar.module.scss';

export const TitleBar = () => {
  const platform = useWindowPlatform();
  const { isMaximized, minimize, toggleMaximize, close } = useWindowControls();

  if (!platform) {
    return null;
  }

  const isMacos = platform === 'macos';

  return (
    <div className={clsx(s.root, isMacos && s.rootMacos)}>
      <div className={s.dragRegion} data-tauri-drag-region>
        <BrandMark className={s.brand} size="sm" tone="muted" />
      </div>

      {!isMacos && (
        <TitleBarControls
          isMaximized={isMaximized}
          onClose={close}
          onMinimize={minimize}
          onToggleMaximize={toggleMaximize}
        />
      )}
    </div>
  );
};

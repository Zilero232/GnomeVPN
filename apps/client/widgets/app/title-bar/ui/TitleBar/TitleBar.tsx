'use client';

import { BrandMark } from '@/shared/ui';

import { useWindowControls, useWindowPlatform } from '../../model/hooks';
import { TitleBarControls } from './components';

import s from './TitleBar.module.scss';

export const TitleBar = () => {
  const platform = useWindowPlatform();
  const { minimize, close } = useWindowControls();

  if (!platform || platform === 'macos') {
    return null;
  }

  return (
    <div className={s.root}>
      <div data-tauri-drag-region className={s.dragRegion}>
        <BrandMark className={s.brand} size='sm' tone='muted' />
      </div>

      <TitleBarControls onClose={close} onMinimize={minimize} />
    </div>
  );
};

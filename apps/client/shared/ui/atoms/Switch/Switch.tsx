import { switchTrack } from './Switch.variants';

import type { SwitchProps } from './Switch.types';

export const Switch = ({ isChecked, className }: SwitchProps) => (
  <span aria-hidden className={switchTrack({ isChecked, class: className })} />
);

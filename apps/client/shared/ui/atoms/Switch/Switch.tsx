import type { SwitchProps } from './Switch.types';

import { switchTrack } from './Switch.variants';

export const Switch = ({ isChecked, className }: SwitchProps) => (
  <span aria-hidden className={switchTrack({ isChecked, class: className })} />
);

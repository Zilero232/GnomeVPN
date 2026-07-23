import type { Limits } from '@gnomevpn/schemas';

export type SlotState = 'owned' | 'pending' | 'empty';

export type ExtraDevicesControlProps = {
  limits: Limits;
};

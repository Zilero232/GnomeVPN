import type { Limits } from '@gnomevpn/schemas';

export type SlotState = 'empty' | 'owned' | 'pending';

export type ExtraDevicesControlProps = {
  limits: Limits;
};

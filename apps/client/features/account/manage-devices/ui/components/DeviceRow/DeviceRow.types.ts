import type { Device } from '@gnomevpn/schemas';

export type DeviceRowProps = {
  device: Device;
  isRemoving: boolean;
  onRemove: () => void;
};

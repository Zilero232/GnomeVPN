import type { Device } from '@gnomevpn/schemas';

export type DevicesListProps = {
  devices: Device[];
  deviceLimit: number;
};

import type { Device } from '@gnomevpn/schemas';

export type DeviceLabelInput = Pick<Device, 'app' | 'model' | 'osVersion' | 'platform'>;

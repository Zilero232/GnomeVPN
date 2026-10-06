import type { DeviceIdentity } from './lib';

export type AdmitDeviceInput = {
  userId: string;
  identity: DeviceIdentity;
  deviceLimit: number;
};

export type AdmittedDevice = {
  deviceId: string | null;
  isAllowed: boolean;
  isNew: boolean;
  deviceCount: number;
};

export type SurplusRevocation = {
  userId: string;
  deviceLimit: number;
  titles: string[];
};

export type RemoveDeviceInput = {
  userId: string;
  deviceId: string;
};

export type RevokePeersInput = {
  deviceIds: string[];
  now: Date;
};

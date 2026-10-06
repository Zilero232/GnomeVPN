export { DEVICE_HEADER, DEVICE_PEER, DEVICE_TITLE, LEGACY_PEER } from './config';
export { DevicesModule } from './devices.module';
export type { AdmittedDevice, SurplusRevocation } from './devices.types';
export { deviceIdentity, devicePeerName, deviceTitle, headerOf } from './lib';
export type { DeviceHeaders, DeviceIdentity } from './lib';
export { DevicesService } from './services';

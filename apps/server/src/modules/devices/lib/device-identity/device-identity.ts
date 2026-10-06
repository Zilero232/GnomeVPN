import type { DeviceHeaders, DeviceIdentity } from './device-identity.types';

import { DEVICE_HEADER, DEVICE_KEY } from '../../config';
import { agentPlatformOf, appOf, cleaned, headerOf, hwidOf } from './device-identity.helpers';

export const deviceIdentity = (headers: DeviceHeaders): DeviceIdentity => {
  const userAgent = headerOf({ headers, name: DEVICE_HEADER.userAgent });
  const hwid = hwidOf(headers);
  const app = appOf(userAgent);

  return {
    key: hwid ? `${DEVICE_KEY.hwid}${hwid}` : `${DEVICE_KEY.app}${(app ?? DEVICE_KEY.unknownApp).toLowerCase()}`,
    hwid,
    platform: cleaned({ value: headerOf({ headers, name: DEVICE_HEADER.platform }) }) ?? agentPlatformOf(userAgent),
    model: cleaned({ value: headerOf({ headers, name: DEVICE_HEADER.model }) }),
    osVersion: cleaned({ value: headerOf({ headers, name: DEVICE_HEADER.osVersion }) }),
    app
  };
};

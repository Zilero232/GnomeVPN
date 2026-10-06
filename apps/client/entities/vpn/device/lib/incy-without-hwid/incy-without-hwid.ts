import type { Device } from '@gnomevpn/schemas';

import { INCY_APP } from '../../config';

export const hasIncyWithoutHwid = (devices: Device[]): boolean => devices.some((device) => device.app === INCY_APP && !device.isIdentified);

import type { z } from 'zod';

import type { deviceIdParamSchema, deviceListSchema, deviceSchema } from './devices.schemas';

export type Device = z.infer<typeof deviceSchema>;

export type DeviceList = z.infer<typeof deviceListSchema>;

export type DeviceIdParam = z.infer<typeof deviceIdParamSchema>;

import { z } from 'zod';

export const limitsSchema = z.object({
  deviceLimit: z.number().int().positive(),
  configLimit: z.number().int().positive(),
  extraDevices: z.number().int().nonnegative(),
  pricePerDeviceRub: z.number().int().positive(),
  maxExtraDevices: z.number().int().positive()
});

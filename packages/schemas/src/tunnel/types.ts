import type { z } from 'zod';
import type { connectInputSchema } from './inputs';
import type { tunnelConfigSchema } from './outputs';

export type ConnectRequest = z.infer<typeof connectInputSchema>;
export type TunnelConfig = z.infer<typeof tunnelConfigSchema>;

import type { z } from 'zod';

import type { realityConfigSchema, tunnelConfigSchema, tunnelProtocolSchema } from './tunnel.schemas';

export type TunnelProtocol = z.infer<typeof tunnelProtocolSchema>;

export type TunnelConfig = z.infer<typeof tunnelConfigSchema>;

export type RealityConfig = z.infer<typeof realityConfigSchema>;

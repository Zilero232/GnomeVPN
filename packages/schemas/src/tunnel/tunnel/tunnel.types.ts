import type { z } from 'zod';

import type { realityConfigSchema, tunnelConfigSchema, tunnelProtocolSchema, wireguardConfigSchema } from './tunnel.schemas';

export type TunnelProtocol = z.infer<typeof tunnelProtocolSchema>;

export type TunnelConfig = z.infer<typeof tunnelConfigSchema>;

export type WireguardConfig = z.infer<typeof wireguardConfigSchema>;

export type RealityConfig = z.infer<typeof realityConfigSchema>;

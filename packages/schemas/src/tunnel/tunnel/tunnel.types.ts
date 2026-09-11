import type { z } from 'zod';

import type { connectInputSchema, disconnectInputSchema, tunnelConfigSchema, tunnelProtocolSchema, wireguardConfigSchema } from './tunnel.schemas';

export type TunnelProtocol = z.infer<typeof tunnelProtocolSchema>;

export type TunnelConfig = z.infer<typeof tunnelConfigSchema>;

export type WireguardConfig = z.infer<typeof wireguardConfigSchema>;

export type ConnectRequest = z.infer<typeof connectInputSchema>;

export type DisconnectRequest = z.infer<typeof disconnectInputSchema>;

import { connectInputSchema, tunnelConfigSchema } from '@vesper/schemas';
import { createZodDto } from 'nestjs-zod';

export class ConnectDto extends createZodDto(connectInputSchema) {}
export class TunnelConfigDto extends createZodDto(tunnelConfigSchema) {}

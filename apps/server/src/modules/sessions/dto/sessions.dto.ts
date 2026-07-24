import {
  connectInputSchema,
  deviceUsageSchema,
  disconnectInputSchema,
  heartbeatInputSchema,
  tunnelConfigSchema,
} from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class ConnectDto extends createZodDto(connectInputSchema) {}
export class DisconnectDto extends createZodDto(disconnectInputSchema) {}
export class HeartbeatDto extends createZodDto(heartbeatInputSchema) {}
export class TunnelConfigDto extends createZodDto(tunnelConfigSchema) {}
export class DeviceUsageDto extends createZodDto(deviceUsageSchema) {}

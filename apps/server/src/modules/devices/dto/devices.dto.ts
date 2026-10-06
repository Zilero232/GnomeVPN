import { deviceIdParamSchema, deviceListSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class DeviceListDto extends createZodDto(deviceListSchema) {}

export class DeviceIdParamDto extends createZodDto(deviceIdParamSchema) {}

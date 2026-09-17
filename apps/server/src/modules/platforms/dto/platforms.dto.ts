import { platformSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class PlatformDto extends createZodDto(platformSchema) {}

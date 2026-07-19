import { releaseSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class ReleaseDto extends createZodDto(releaseSchema) {}

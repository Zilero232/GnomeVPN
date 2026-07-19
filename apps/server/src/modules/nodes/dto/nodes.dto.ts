import { nodeSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class NodeDto extends createZodDto(nodeSchema) {}

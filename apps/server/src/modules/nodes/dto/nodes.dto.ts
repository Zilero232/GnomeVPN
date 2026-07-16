import { nodeSchema } from '@vesper/schemas';
import { createZodDto } from 'nestjs-zod';

export class NodeDto extends createZodDto(nodeSchema) {}

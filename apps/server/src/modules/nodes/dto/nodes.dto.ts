import { nodeEndpointSchema, nodeSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class NodeDto extends createZodDto(nodeSchema) {}

export class NodeEndpointDto extends createZodDto(nodeEndpointSchema) {}

import { Controller, Get } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { NodeDto } from './dto/nodes.dto';
import { NodesService } from './services';

@Controller('nodes')
export class NodesController {
  constructor(private readonly nodes: NodesService) {}

  @Get()
  @ZodResponse({ type: [NodeDto] })
  listNodes() {
    return this.nodes.listPublicNodes();
  }
}

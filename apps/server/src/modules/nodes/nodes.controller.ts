import { Controller, Get, UseGuards } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { SubscriptionGuard } from '../subscription';
import { NodeDto, NodeEndpointDto } from './dto/nodes.dto';
import { NodesService } from './services';

@Controller('nodes')
export class NodesController {
  constructor(private readonly nodes: NodesService) {}

  @Get()
  @ZodResponse({ type: [NodeDto] })
  listNodes() {
    return this.nodes.listPublicNodes();
  }

  @Get('endpoints')
  @UseGuards(SubscriptionGuard)
  @ZodResponse({ type: [NodeEndpointDto] })
  listEndpoints() {
    return this.nodes.listEndpoints();
  }
}

import { isNullish } from 'remeda';

import type { PanelClient } from '../panel-client';
import type { CreateInboundInput, XrayInbound } from './inbounds.types';

import { AppServiceUnavailableException } from '../../../common/exceptions';
import { INBOUND_REMARK } from './inbounds.constants';
import { inboundPayload } from './inbounds.helpers';

export class Inbounds {
  constructor(private readonly panel: PanelClient) {}

  async find(remark: string = INBOUND_REMARK): Promise<XrayInbound | undefined> {
    const inbounds = await this.panel.listInbounds();

    return inbounds.find((inbound) => inbound.remark === remark);
  }

  async get(remark: string = INBOUND_REMARK): Promise<XrayInbound> {
    const inbound = await this.find(remark);

    if (isNullish(inbound)) {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', `no inbound remarked ${remark}`);
    }

    return inbound;
  }

  async create({ inbound, remark = INBOUND_REMARK }: CreateInboundInput): Promise<void> {
    await this.panel.addInbound(inboundPayload(inbound, remark));
  }
}

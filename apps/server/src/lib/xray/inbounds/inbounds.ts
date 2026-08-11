import type { PanelClient } from '../panel-client';
import type { WriteInboundClientsInput, XrayInbound, XrayInboundPayload } from './inbounds.types';

import { AppServiceUnavailableException } from '../../../common/exceptions';
import { parseSniffing, parseStreamSettings } from '../xray.helpers';
import { INBOUND_REMARK } from './inbounds.constants';

const stringify = (value: unknown) => (value === undefined ? '' : JSON.stringify(value));

export const inboundPayload = (inbound: Record<string, unknown>, remark: string = INBOUND_REMARK): XrayInboundPayload => ({
  ...inbound,
  remark,
  enable: true,
  port: inbound.port as number,
  protocol: inbound.protocol as string,
  settings: JSON.stringify(inbound.settings),
  streamSettings: stringify(inbound.streamSettings),
  sniffing: stringify(inbound.sniffing)
});

export class Inbounds {
  constructor(private readonly panel: PanelClient) {}

  async find(remark: string = INBOUND_REMARK): Promise<XrayInbound | undefined> {
    const inbounds = await this.panel.listInbounds();

    return inbounds.find((inbound) => inbound.remark === remark);
  }

  async get(remark: string = INBOUND_REMARK): Promise<XrayInbound> {
    const inbound = await this.find(remark);

    if (!inbound) {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', `no inbound remarked ${remark}`);
    }

    return inbound;
  }

  async create(inbound: Record<string, unknown>, remark: string = INBOUND_REMARK): Promise<void> {
    await this.panel.addInbound(inboundPayload(inbound, remark));
  }

  async writeClients({ inbound, protocol, settings, remark }: WriteInboundClientsInput): Promise<void> {
    await this.panel.updateInbound(
      inbound.id,
      inboundPayload(
        {
          port: inbound.port,
          protocol,
          settings,
          streamSettings: parseStreamSettings(inbound),
          sniffing: parseSniffing(inbound)
        },
        remark
      )
    );
  }
}

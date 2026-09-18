import type { Inbounds } from '../inbounds';
import type { PanelClient } from '../panel-client';
import type { CreateVlessClientInput, CreateVlessClientResult, VlessClient } from './vless.types';

import { ProtocolClients } from '../protocol-clients';
import { VLESS_INBOUND_REMARK } from './vless.constants';

export class VlessClients {
  private readonly clients: ProtocolClients<VlessClient>;

  constructor(panel: PanelClient, inbounds: Inbounds, nodeKey: string) {
    this.clients = new ProtocolClients<VlessClient>({
      panel,
      inbounds,
      nodeKey,
      remark: VLESS_INBOUND_REMARK,
      credentialOf: (client) => client.id,
      add: ({ inboundId, email, credential, limitIp }) => panel.addVlessClient({ inboundId, email, id: credential, limitIp })
    });
  }

  async list(): Promise<VlessClient[]> {
    return this.clients.list();
  }

  async create({ email, id, limitIp, deferRestart }: CreateVlessClientInput): Promise<CreateVlessClientResult> {
    return this.clients.create({ email, credential: id, limitIp, deferRestart });
  }
}

import type { Inbounds } from '../inbounds';
import type { PanelClient } from '../panel-client';
import type { CreateClientInput, CreateClientResult, HysteriaClient, SetClientsEnabledInput } from './hysteria.types';

import { ProtocolClients } from '../protocol-clients';
import { serializeByKey } from '../serialize';

export class HysteriaClients {
  private readonly clients: ProtocolClients<HysteriaClient>;

  constructor(
    private readonly panel: PanelClient,
    inbounds: Inbounds,
    private readonly nodeKey: string
  ) {
    this.clients = new ProtocolClients<HysteriaClient>({
      panel,
      inbounds,
      nodeKey,
      credentialOf: (client) => client.auth,
      add: ({ inboundId, email, credential }) => panel.addClient({ inboundId, email, auth: credential })
    });
  }

  async list(): Promise<HysteriaClient[]> {
    return this.clients.list();
  }

  async create({ email, auth, deferRestart }: CreateClientInput): Promise<CreateClientResult> {
    return this.clients.create({ email, credential: auth, deferRestart });
  }

  async delete(email: string): Promise<void> {
    return this.clients.delete(email);
  }

  async setEnabled({ emails, enabled }: SetClientsEnabledInput): Promise<void> {
    return serializeByKey({ key: this.nodeKey, task: () => this.panel.setClientsEnabled({ emails, enabled }) });
  }

  async deleteOrphans(): Promise<number> {
    return serializeByKey({ key: this.nodeKey, task: () => this.panel.deleteOrphanClients() });
  }
}

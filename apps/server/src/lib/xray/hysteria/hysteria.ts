import type { Inbounds } from '../inbounds';
import type { PanelClient } from '../panel-client';
import type { CreateClientInput, CreateClientResult, HysteriaClient, SetClientsEnabledInput } from './hysteria.types';

import { serializeByKey } from '../serialize';
import { parseSettings } from '../xray.helpers';

export class HysteriaClients {
  constructor(
    private readonly panel: PanelClient,
    private readonly inbounds: Inbounds,
    private readonly nodeKey: string
  ) {}

  async list(): Promise<HysteriaClient[]> {
    const inbound = await this.inbounds.get();

    return (parseSettings(inbound).clients ?? []).filter((client): client is HysteriaClient => Boolean(client?.auth && client?.email));
  }

  async create({ email, auth }: CreateClientInput): Promise<CreateClientResult> {
    return serializeByKey({
      key: this.nodeKey,
      task: async () => {
        const clients = await this.list();
        const existing = clients.find((client) => client.email === email);

        if (existing) {
          await this.panel.setClientsEnabled({ emails: [email], enabled: true });
          await this.panel.restartCore();

          return { nodeCredential: existing.auth, email };
        }

        const inbound = await this.inbounds.get();

        await this.panel.addClient({ inboundId: inbound.id, email, auth });
        await this.panel.restartCore();

        return { nodeCredential: auth, email };
      }
    });
  }

  async delete(email: string): Promise<void> {
    return serializeByKey({ key: this.nodeKey, task: () => this.panel.deleteClient(email) });
  }

  async setEnabled({ emails, enabled }: SetClientsEnabledInput): Promise<void> {
    return serializeByKey({ key: this.nodeKey, task: () => this.panel.setClientsEnabled({ emails, enabled }) });
  }

  async deleteOrphans(): Promise<number> {
    return serializeByKey({ key: this.nodeKey, task: () => this.panel.deleteOrphanClients() });
  }
}

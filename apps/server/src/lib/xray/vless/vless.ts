import type { Inbounds } from '../inbounds';
import type { PanelClient } from '../panel-client';
import type { CreateVlessClientInput, CreateVlessClientResult, VlessClient } from './vless.types';

import { serializeByKey } from '../serialize';
import { readSettings } from '../xray.helpers';
import { VLESS_INBOUND_REMARK } from './vless.constants';

export class VlessClients {
  constructor(
    private readonly panel: PanelClient,
    private readonly inbounds: Inbounds,
    private readonly nodeKey: string
  ) {}

  async list(): Promise<VlessClient[]> {
    const inbound = await this.inbounds.get(VLESS_INBOUND_REMARK);

    const settings = readSettings<{ clients?: VlessClient[] }>(inbound);

    return (settings?.clients ?? []).filter((client) => Boolean(client?.id && client?.email));
  }

  async create({ email, id, deferRestart }: CreateVlessClientInput): Promise<CreateVlessClientResult> {
    return serializeByKey({
      key: this.nodeKey,
      task: async () => {
        const clients = await this.list();
        const existing = clients.find((client) => client.email === email);

        if (existing) {
          await this.panel.setClientsEnabled({ emails: [email], enabled: true });

          if (!deferRestart) {
            await this.panel.restartCore();
          }

          return { nodeCredential: existing.id, email };
        }

        const inbound = await this.inbounds.get(VLESS_INBOUND_REMARK);

        await this.panel.addVlessClient({ inboundId: inbound.id, email, id });

        if (!deferRestart) {
          await this.panel.restartCore();
        }

        return { nodeCredential: id, email };
      }
    });
  }
}

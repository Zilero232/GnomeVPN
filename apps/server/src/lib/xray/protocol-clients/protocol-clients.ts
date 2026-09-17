import { isNonNullish, isNullish } from 'remeda';

import type { IssueProtocolClientInput, IssueProtocolClientResult, ProtocolClient, ProtocolClientsInput } from './protocol-clients.types';

import { AppServiceUnavailableException } from '../../../common/exceptions';
import { serializeByKey } from '../serialize';
import { readSettings } from '../xray.helpers';

export class ProtocolClients<TClient extends ProtocolClient> {
  constructor(private readonly options: ProtocolClientsInput<TClient>) {}

  async list(): Promise<TClient[]> {
    const inbound = await this.options.inbounds.get(this.options.remark);

    const settings = readSettings<{ clients?: TClient[] }>(inbound);

    if (isNullish(settings)) {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'refusing to read an inbound whose settings could not be parsed');
    }

    return (settings.clients ?? []).filter((client) => Boolean(client?.email) && isNonNullish(this.options.credentialOf(client)));
  }

  async create({ email, credential, deferRestart }: IssueProtocolClientInput): Promise<IssueProtocolClientResult> {
    return serializeByKey({
      key: this.options.nodeKey,
      task: async () => {
        const clients = await this.list();
        const existing = clients.find((client) => client.email === email);

        if (existing) {
          await this.options.panel.setClientsEnabled({ emails: [email], enabled: true });
          await this.restart(deferRestart);

          return { nodeCredential: this.options.credentialOf(existing) ?? credential, email };
        }

        const inbound = await this.options.inbounds.get(this.options.remark);

        await this.options.add({ inboundId: inbound.id, email, credential });
        await this.restart(deferRestart);

        return { nodeCredential: credential, email };
      }
    });
  }

  async delete(email: string): Promise<void> {
    return serializeByKey({ key: this.options.nodeKey, task: () => this.options.panel.deleteClient(email) });
  }

  private async restart(deferRestart?: boolean): Promise<void> {
    if (deferRestart) {
      return;
    }

    await this.options.panel.restartCore();
  }
}

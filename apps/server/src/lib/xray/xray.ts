import { Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { CreateClientResult, SetClientEnabledInput, SetClientsEnabledInput } from './hysteria';
import type { CreateVlessClientResult } from './vless';
import type { XrayClientOptions } from './xray.types';

import { AppServiceUnavailableException } from '../../common/exceptions';
import { HysteriaClients } from './hysteria';
import { inboundPayload, Inbounds } from './inbounds';
import { PanelClient } from './panel-client';
import { serializeByKey } from './serialize';
import { VLESS_INBOUND_REMARK, VlessClients } from './vless';
import { REQUEST_TIMEOUT_MS, XRAY_STATE_RUNNING } from './xray.constants';
import { generateAuth, readClients } from './xray.helpers';

export class XrayClient {
  private static readonly logger = new Logger(XrayClient.name);

  private readonly panel: PanelClient;
  private readonly nodeKey: string;
  private readonly inbounds: Inbounds;
  private readonly hysteria: HysteriaClients;
  private readonly vless: VlessClients;

  constructor(opts: XrayClientOptions) {
    this.nodeKey = opts.baseUrl.replace(/\/$/, '');

    this.panel = new PanelClient({
      baseUrl: this.nodeKey,
      token: opts.token,
      timeout: REQUEST_TIMEOUT_MS
    });

    this.inbounds = new Inbounds(this.panel);
    this.hysteria = new HysteriaClients(this.panel, this.inbounds, this.nodeKey);
    this.vless = new VlessClients(this.panel, this.inbounds, this.nodeKey);
  }

  async hasInbound(): Promise<boolean> {
    return Boolean(await this.inbounds.find());
  }

  async hasVlessInbound(): Promise<boolean> {
    return Boolean(await this.inbounds.find(VLESS_INBOUND_REMARK));
  }

  async createInbound(inbound: Record<string, unknown>): Promise<void> {
    await this.inbounds.create(inbound);
  }

  async updateInbound(inbound: Record<string, unknown>): Promise<void> {
    return serializeByKey({
      key: this.nodeKey,
      task: async () => {
        const current = await this.inbounds.get();
        const clients = readClients(current);

        if (clients === null) {
          throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'refusing to rewrite an inbound whose clients could not be read');
        }

        const settings = { ...(inbound.settings as object), clients };

        await this.panel.updateInbound(current.id, inboundPayload({ ...inbound, settings }));
      }
    });
  }

  // Same contract as updateInbound: a re-provision must never drop the clients
  // already on the node, so an inbound whose client list cannot be read is left
  // alone rather than rewritten from the template.
  async ensureVlessInbound(inbound: Record<string, unknown>): Promise<void> {
    return serializeByKey({
      key: this.nodeKey,
      task: async () => {
        const current = await this.inbounds.find(VLESS_INBOUND_REMARK);

        if (!current) {
          await this.inbounds.create(inbound, VLESS_INBOUND_REMARK);

          return;
        }

        const clients = readClients(current);

        if (clients === null) {
          throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'refusing to rewrite a reality inbound whose clients could not be read');
        }

        const settings = { ...(inbound.settings as object), clients };

        await this.panel.updateInbound(current.id, inboundPayload({ ...inbound, settings }, VLESS_INBOUND_REMARK));
      }
    });
  }

  async createClient(email: string): Promise<CreateClientResult> {
    return this.hysteria.create({ email, auth: generateAuth() });
  }

  async createVlessClient(email: string): Promise<CreateVlessClientResult> {
    return this.vless.create({ email, id: randomUUID() });
  }

  async deleteClient(email: string): Promise<void> {
    return this.hysteria.delete(email);
  }

  async setClientEnabled({ email, enabled }: SetClientEnabledInput): Promise<void> {
    return this.hysteria.setEnabled({ emails: [email], enabled });
  }

  async setClientsEnabled({ emails, enabled }: SetClientsEnabledInput): Promise<void> {
    return this.hysteria.setEnabled({ emails, enabled });
  }

  async deleteOrphanClients(): Promise<number> {
    return this.hysteria.deleteOrphans();
  }

  async clientEnabledByEmail(): Promise<Map<string, boolean>> {
    const [hysteria, vless] = await Promise.all([this.hysteria.list(), this.vless.list()]);

    return new Map([...hysteria, ...vless].map((client) => [client.email, client.enable ?? true]));
  }

  async restartCore(): Promise<void> {
    await this.panel.restartCore();
  }

  async onlineEmails(): Promise<Set<string> | null> {
    return this.panel.onlineEmails();
  }

  async isReachable(): Promise<boolean> {
    try {
      await this.panel.listInbounds();

      return true;
    } catch (error) {
      XrayClient.logger.warn(`node ${this.nodeKey} unreachable: ${error}`);

      return false;
    }
  }

  async health(): Promise<boolean> {
    const [inbound, status] = await Promise.all([this.inbounds.get(), this.panel.serverStatus()]);

    return inbound.enable && status.xray?.state === XRAY_STATE_RUNNING;
  }
}

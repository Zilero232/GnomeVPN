import { randomBytes } from 'node:crypto';

import { currentClients, panelApi, parseSettings, parseStreamSettings } from './lib';
import { AUTH_BYTES, INBOUND_REMARK, REQUEST_TIMEOUT_MS, UNLIMITED } from './xray.constants';

import type ThreeXUI from '3xui-api-client';
import type {
  CreateClientResult,
  HysteriaClient,
  XrayApiResponse,
  XrayClientOptions,
  XrayInbound,
  XrayInboundPayload,
} from './xray.types';

export class XrayClient {
  private readonly panel: ThreeXUI;

  constructor(opts: XrayClientOptions) {
    this.panel = panelApi({
      baseUrl: opts.baseUrl.replace(/\/$/, ''),
      token: opts.token,
      timeout: REQUEST_TIMEOUT_MS,
    });
  }

  private unwrap<T>(body: XrayApiResponse<T>, action: string): T {
    if (!body.success) {
      throw new Error(`xray ${action} rejected: ${body.msg}`);
    }

    return body.obj;
  }

  private async findInbound(): Promise<XrayInbound | undefined> {
    const inbounds = this.unwrap(
      (await this.panel.getInbounds()) as XrayApiResponse<XrayInbound[]>,
      'listInbounds',
    );

    return inbounds.find((inbound) => inbound.remark === INBOUND_REMARK);
  }

  private async getInbound(): Promise<XrayInbound> {
    const inbound = await this.findInbound();

    if (!inbound) {
      throw new Error(`xray getInbound failed: no inbound remarked ${INBOUND_REMARK}`);
    }

    return inbound;
  }

  async hasInbound(): Promise<boolean> {
    return Boolean(await this.findInbound());
  }

  private inboundPayload(inbound: Record<string, unknown>): XrayInboundPayload {
    return {
      ...inbound,
      remark: INBOUND_REMARK,
      enable: true,
      port: inbound.port as number,
      protocol: inbound.protocol as string,
      settings: JSON.stringify(inbound.settings),
      streamSettings: JSON.stringify(inbound.streamSettings),
      sniffing: JSON.stringify(inbound.sniffing),
    };
  }

  async createInbound(inbound: Record<string, unknown>): Promise<void> {
    this.unwrap(
      (await this.panel.addInbound(this.inboundPayload(inbound))) as XrayApiResponse<unknown>,
      'createInbound',
    );
  }

  async updateInbound(inbound: Record<string, unknown>): Promise<void> {
    const current = await this.getInbound();
    const clients = currentClients(current);
    const settings = { ...(inbound.settings as object), clients };

    this.unwrap(
      (await this.panel.updateInbound(
        current.id,
        this.inboundPayload({ ...inbound, settings }),
      )) as XrayApiResponse<unknown>,
      'updateInbound',
    );
  }

  private async writeClients(clients: HysteriaClient[]): Promise<void> {
    const inbound = await this.getInbound();
    const settings = { ...parseSettings(inbound), clients };

    this.unwrap(
      (await this.panel.updateInbound(
        inbound.id,
        this.inboundPayload({
          port: inbound.port,
          protocol: 'hysteria',
          settings,
          streamSettings: parseStreamSettings(inbound),
          sniffing:
            typeof inbound.sniffing === 'string'
              ? JSON.parse(inbound.sniffing)
              : (inbound.sniffing ?? {}),
        }),
      )) as XrayApiResponse<unknown>,
      'updateInbound',
    );
  }

  private newClient({ email, auth }: HysteriaClient): HysteriaClient {
    return {
      email,
      auth,
      enable: true,
      limitIp: UNLIMITED,
      totalGB: UNLIMITED,
      expiryTime: UNLIMITED,
      tgId: UNLIMITED,
      reset: UNLIMITED,
    };
  }

  async createClient(email: string): Promise<CreateClientResult> {
    const clients = await this.listClients();
    const existing = clients.find((client) => client.email === email);

    if (existing) {
      return { xrayUserId: existing.auth, email };
    }

    const auth = randomBytes(AUTH_BYTES).toString('hex');
    await this.writeClients([...clients, this.newClient({ email, auth })]);
    await this.restartCore();

    return { xrayUserId: auth, email };
  }

  async restartCore(): Promise<void> {
    this.unwrap((await this.panel.restartXrayService()) as XrayApiResponse<unknown>, 'restartCore');
  }

  private async listClients(): Promise<HysteriaClient[]> {
    const inbound = await this.getInbound();

    return (parseSettings(inbound).clients ?? []).filter((client): client is HysteriaClient =>
      Boolean(client?.auth && client?.email),
    );
  }

  async deleteClient(email: string): Promise<void> {
    const clients = await this.listClients();
    const kept = clients.filter((client) => client.email !== email);

    if (kept.length === clients.length) {
      return;
    }

    await this.writeClients(kept);
    await this.restartCore();
  }

  async getClientTraffic(email: string): Promise<number | null> {
    try {
      const body = await this.panel.getClientTraffic(email);

      return body.success ? body.obj.up + body.obj.down : null;
    } catch {
      return null;
    }
  }

  async isReachable(): Promise<boolean> {
    try {
      await this.panel.getInbounds();

      return true;
    } catch {
      return false;
    }
  }

  async health(): Promise<boolean> {
    try {
      return (await this.getInbound()).enable;
    } catch {
      return false;
    }
  }
}

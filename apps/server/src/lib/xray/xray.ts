import { currentClients, panelApi } from './lib';
import { CLIENT_FLOW, INBOUND_REMARK, REQUEST_TIMEOUT_MS, UNLIMITED } from './xray.constants';

import type ThreeXUI from '3xui-api-client';
import type { ModernClient } from '3xui-api-client';
import type {
  CreateClientResult,
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

  private async inboundId(): Promise<number> {
    return (await this.getInbound()).id;
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
    const settings = { ...(inbound.settings as object), clients: currentClients(current) };

    this.unwrap(
      (await this.panel.updateInbound(
        current.id,
        this.inboundPayload({ ...inbound, settings }),
      )) as XrayApiResponse<unknown>,
      'updateInbound',
    );
  }

  // Adding a client only reaches the running core through a restart, and that
  // restart drops every live session on the node. Reconnecting therefore has to
  // reuse the client the node already has: recreating it on each connect makes
  // the two devices restart the core in turn, and neither ever gets a session
  // that outlives the next reconnect.
  async createClient(email: string): Promise<CreateClientResult> {
    const existing = (await this.listClients()).find(
      (client) => client.email === email && client.enable,
    );

    if (existing?.uuid) {
      return { xrayUserId: existing.uuid, email };
    }

    await this.deleteClient(email);

    this.unwrap(
      await this.panel.addModernClient({
        client: {
          uuid: this.panel.generateUUID(),
          email,
          enable: true,
          flow: CLIENT_FLOW,
          limitIp: UNLIMITED,
          totalGB: UNLIMITED,
          expiryTime: UNLIMITED,
          tgId: UNLIMITED,
        },
        inboundIds: [await this.inboundId()],
      }),
      'createClient',
    );

    const row = (await this.listClients()).find((client) => client.email === email);

    if (!row?.uuid) {
      throw new Error(`xray createClient failed: ${email} is missing after creation`);
    }

    await this.restartCore();

    return { xrayUserId: row.uuid, email };
  }

  // The panel stores a new client in its own database and leaves the running
  // core on the config it started with, where "clients" is still null. Without
  // this the node answers the TLS handshake and then rejects every vless
  // session, so a tunnel connects and carries nothing.
  //
  // The restart drops every live session on the node, and the panel exposes no
  // lighter way to make the core reread its config — `restartXrayService` is
  // the only endpoint that applies one.
  async restartCore(): Promise<void> {
    this.unwrap((await this.panel.restartXrayService()) as XrayApiResponse<unknown>, 'restartCore');
  }

  private async listClients(): Promise<ModernClient[]> {
    return this.unwrap(
      (await this.panel.getClients()) as XrayApiResponse<ModernClient[]>,
      'listClients',
    );
  }

  async deleteClient(email: string): Promise<void> {
    const body = await this.panel.deleteModernClient(email);

    if (!body.success && !body.msg.toLowerCase().includes('not found')) {
      throw new Error(`xray deleteClient rejected: ${body.msg}`);
    }
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

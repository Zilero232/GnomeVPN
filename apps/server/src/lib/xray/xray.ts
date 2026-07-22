import { randomUUID } from 'node:crypto';

import { currentClients } from './lib/current-clients';
import { CLIENT_FLOW, INBOUND_REMARK, REQUEST_TIMEOUT_MS, UNLIMITED } from './xray.constants';

import type {
  CreateClientResult,
  XrayApiResponse,
  XrayClientOptions,
  XrayClientRow,
  XrayClientTraffic,
  XrayInbound,
} from './xray.types';

export class XrayClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(opts: XrayClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.token = opts.token;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<XrayApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        ...init?.headers,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`xray ${path} failed: ${res.status}`);
    }

    return (await res.json()) as XrayApiResponse<T>;
  }

  private async listInbounds(): Promise<XrayInbound[]> {
    const body = await this.request<XrayInbound[]>('/panel/api/inbounds/list');

    if (!body.success) {
      throw new Error(`xray listInbounds rejected: ${body.msg}`);
    }

    return body.obj;
  }

  private async findInbound(): Promise<XrayInbound | undefined> {
    return (await this.listInbounds()).find((inbound) => inbound.remark === INBOUND_REMARK);
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

  private inboundPayload(inbound: Record<string, unknown>): string {
    return JSON.stringify({
      ...inbound,
      remark: INBOUND_REMARK,
      enable: true,
      settings: JSON.stringify(inbound.settings),
      streamSettings: JSON.stringify(inbound.streamSettings),
      sniffing: JSON.stringify(inbound.sniffing),
    });
  }

  async createInbound(inbound: Record<string, unknown>): Promise<void> {
    const body = await this.request('/panel/api/inbounds/add', {
      method: 'POST',
      body: this.inboundPayload(inbound),
    });

    if (!body.success) {
      throw new Error(`xray createInbound rejected: ${body.msg}`);
    }
  }

  async updateInbound(inbound: Record<string, unknown>): Promise<void> {
    const current = await this.getInbound();
    const settings = { ...(inbound.settings as object), clients: currentClients(current) };

    const body = await this.request(`/panel/api/inbounds/update/${current.id}`, {
      method: 'POST',
      body: this.inboundPayload({ ...inbound, settings }),
    });

    if (!body.success) {
      throw new Error(`xray updateInbound rejected: ${body.msg}`);
    }
  }

  // Reconnecting reuses the same email, and the panel rejects a duplicate. The
  // old client is dropped rather than kept: a fresh uuid invalidates configs
  // handed out for the previous session.
  async createClient(email: string): Promise<CreateClientResult> {
    await this.deleteClient(email);

    const created = await this.request('/panel/api/clients/add', {
      method: 'POST',
      body: JSON.stringify({
        client: {
          id: randomUUID(),
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
    });

    if (!created.success) {
      throw new Error(`xray createClient rejected: ${created.msg}`);
    }

    const row = (await this.listClients()).find((client) => client.email === email);

    if (!row) {
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
    const body = await this.request('/panel/api/server/restartXrayService', { method: 'POST' });

    if (!body.success) {
      throw new Error(`xray restartCore rejected: ${body.msg}`);
    }
  }

  private async listClients(): Promise<XrayClientRow[]> {
    const body = await this.request<XrayClientRow[]>('/panel/api/clients/list');

    if (!body.success) {
      throw new Error(`xray listClients rejected: ${body.msg}`);
    }

    return body.obj;
  }

  async deleteClient(email: string): Promise<void> {
    const body = await this.request(`/panel/api/clients/del/${encodeURIComponent(email)}`, {
      method: 'POST',
    });

    if (!body.success && !body.msg.toLowerCase().includes('not found')) {
      throw new Error(`xray deleteClient rejected: ${body.msg}`);
    }
  }

  async getClientTraffic(email: string): Promise<number | null> {
    try {
      const body = await this.request<XrayClientTraffic>(
        `/panel/api/clients/traffic/${encodeURIComponent(email)}`,
      );

      return body.success ? body.obj.up + body.obj.down : null;
    } catch {
      return null;
    }
  }

  async isReachable(): Promise<boolean> {
    try {
      await this.request<XrayInbound[]>('/panel/api/inbounds/list');

      return true;
    } catch {
      return false;
    }
  }

  async health(): Promise<boolean> {
    try {
      const inbound = await this.getInbound();

      return inbound.enable;
    } catch {
      return false;
    }
  }
}

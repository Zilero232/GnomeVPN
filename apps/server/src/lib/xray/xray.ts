import { randomBytes } from 'node:crypto';
import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { Logger } from '@nestjs/common';

import {
  currentClients,
  generateAuth,
  panelApi,
  parseSettings,
  parseSniffing,
  parseStreamSettings,
  parseWireguardSettings,
  serializeByKey,
  stripCidrMask,
} from './lib';
import {
  INBOUND_REMARK,
  REQUEST_TIMEOUT_MS,
  UNLIMITED,
  WG_INBOUND_REMARK,
  WG_PEER_ID_BYTES,
  WG_PEER_KEEPALIVE,
  XRAY_STATE_RUNNING,
} from './xray.constants';

import type ThreeXUI from '3xui-api-client';
import type {
  AddWireguardPeerInput,
  CreateClientResult,
  HysteriaClient,
  NewWireguardClientInput,
  RemovePeerInput,
  RemoveWireguardPeerInput,
  WireguardClient,
  XrayApiResponse,
  XrayClientOptions,
  XrayInbound,
  XrayInboundPayload,
  XrayServerStatus,
} from './xray.types';

export class XrayClient {
  private static readonly logger = new Logger(XrayClient.name);
  private readonly panel: ThreeXUI;
  private readonly nodeKey: string;

  constructor(opts: XrayClientOptions) {
    this.nodeKey = opts.baseUrl.replace(/\/$/, '');
    this.panel = panelApi({
      baseUrl: this.nodeKey,
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

  private async findInbound(remark: string = INBOUND_REMARK): Promise<XrayInbound | undefined> {
    const inbounds = this.unwrap(
      (await this.panel.getInbounds()) as XrayApiResponse<XrayInbound[]>,
      'listInbounds',
    );

    return inbounds.find((inbound) => inbound.remark === remark);
  }

  private async getInbound(remark: string = INBOUND_REMARK): Promise<XrayInbound> {
    const inbound = await this.findInbound(remark);

    if (!inbound) {
      throw new Error(`xray getInbound failed: no inbound remarked ${remark}`);
    }

    return inbound;
  }

  async hasInbound(): Promise<boolean> {
    return Boolean(await this.findInbound());
  }

  async hasWireguardInbound(): Promise<boolean> {
    return Boolean(await this.findInbound(WG_INBOUND_REMARK));
  }

  private inboundPayload(
    inbound: Record<string, unknown>,
    remark: string = INBOUND_REMARK,
  ): XrayInboundPayload {
    const stringify = (value: unknown): string =>
      value === undefined ? '' : JSON.stringify(value);

    return {
      ...inbound,
      remark,
      enable: true,
      port: inbound.port as number,
      protocol: inbound.protocol as string,
      settings: JSON.stringify(inbound.settings),
      streamSettings: stringify(inbound.streamSettings),
      sniffing: stringify(inbound.sniffing),
    };
  }

  async createInbound(inbound: Record<string, unknown>): Promise<void> {
    this.unwrap(
      (await this.panel.addInbound(this.inboundPayload(inbound))) as XrayApiResponse<unknown>,
      'createInbound',
    );
  }

  async ensureWireguardInbound(inbound: Record<string, unknown>): Promise<void> {
    return serializeByKey(this.nodeKey, async () => {
      if (await this.hasWireguardInbound()) {
        return;
      }

      this.unwrap(
        (await this.panel.addInbound(
          this.inboundPayload(inbound, WG_INBOUND_REMARK),
        )) as XrayApiResponse<unknown>,
        'createWireguardInbound',
      );
    });
  }

  async updateInbound(inbound: Record<string, unknown>): Promise<void> {
    return serializeByKey(this.nodeKey, async () => {
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
    });
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
          sniffing: parseSniffing(inbound),
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
    return serializeByKey(this.nodeKey, async () => {
      const clients = await this.listClients();
      const existing = clients.find((client) => client.email === email);

      if (existing) {
        return { nodeCredential: existing.auth, email };
      }

      const auth = generateAuth();
      await this.writeClients([...clients, this.newClient({ email, auth })]);
      await this.restartCore();

      return { nodeCredential: auth, email };
    });
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
    return serializeByKey(this.nodeKey, async () => {
      const clients = await this.listClients();
      const kept = clients.filter((client) => client.email !== email);

      if (kept.length === clients.length) {
        return;
      }

      await this.writeClients(kept);
      await this.restartCore();
    });
  }

  private async writeWireguardClients(clients: WireguardClient[]): Promise<void> {
    const inbound = await this.getInbound(WG_INBOUND_REMARK);
    const { peers: _legacyPeers, ...current } = parseWireguardSettings(inbound) as Record<
      string,
      unknown
    >;
    const settings = { ...current, clients };

    this.unwrap(
      (await this.panel.updateInbound(
        inbound.id,
        this.inboundPayload(
          {
            port: inbound.port,
            protocol: 'wireguard',
            settings,
            streamSettings: parseStreamSettings(inbound),
            sniffing: parseSniffing(inbound),
          },
          WG_INBOUND_REMARK,
        ),
      )) as XrayApiResponse<unknown>,
      'updateInbound',
    );
  }

  private async listWireguardClients(): Promise<WireguardClient[]> {
    const inbound = await this.findInbound(WG_INBOUND_REMARK);

    if (!inbound) {
      return [];
    }

    return (parseWireguardSettings(inbound).clients ?? []).filter(
      (client): client is WireguardClient =>
        Boolean(client?.email && client?.publicKey && client?.allowedIPs),
    );
  }

  private newWireguardClient({
    email,
    publicKey,
    assignedIp,
  }: NewWireguardClientInput): WireguardClient {
    return {
      email,
      id: randomBytes(WG_PEER_ID_BYTES).toString('hex'),
      publicKey,
      allowedIPs: [`${assignedIp}/32`],
      preSharedKey: '',
      keepAlive: WG_PEER_KEEPALIVE,
      enable: true,
    };
  }

  private clientIps(clients: WireguardClient[]): string[] {
    return clients.flatMap((client) => client.allowedIPs.map(stripCidrMask));
  }

  async addWireguardPeer({
    email,
    publicKey,
    takenIps,
    allocateIp,
  }: AddWireguardPeerInput): Promise<string> {
    return serializeByKey(this.nodeKey, async () => {
      const clients = await this.listWireguardClients();
      const reused = clients.find((client) => client.email === email);
      const reusedIps = new Set((reused?.allowedIPs ?? []).map(stripCidrMask));

      const claimed = [...takenIps, ...this.clientIps(clients)].filter((ip) => !reusedIps.has(ip));
      const assignedIp = allocateIp(claimed);

      if (!assignedIp) {
        throw new Error('xray addWireguardPeer failed: wireguard subnet exhausted');
      }

      const peer = this.newWireguardClient({ email, publicKey, assignedIp });

      const conflictsWithPeer = (client: WireguardClient): boolean =>
        client.email === peer.email ||
        client.publicKey === peer.publicKey ||
        client.allowedIPs.some((ip) => peer.allowedIPs.includes(ip));

      const kept = clients.filter((client) => !conflictsWithPeer(client));

      await this.writeWireguardClients([...kept, peer]);
      await this.restartCore();

      return assignedIp;
    });
  }

  async removeWireguardPeer({ email }: RemoveWireguardPeerInput): Promise<void> {
    return serializeByKey(this.nodeKey, async () => {
      const clients = await this.listWireguardClients();
      const kept = clients.filter((client) => client.email !== email);

      if (kept.length === clients.length) {
        return;
      }

      await this.writeWireguardClients(kept);
      await this.restartCore();
    });
  }

  async removePeer({ email, protocol }: RemovePeerInput): Promise<void> {
    if (protocol === TUNNEL_PROTOCOL.wireguard) {
      await this.removeWireguardPeer({ email });

      return;
    }

    await this.deleteClient(email);
  }

  async getClientTraffic(email: string): Promise<number | null> {
    try {
      const body = await this.panel.getClientTraffic(email);

      return body.success ? body.obj.up + body.obj.down : null;
    } catch (error) {
      XrayClient.logger.warn(`traffic lookup failed for ${email} on ${this.nodeKey}: ${error}`);

      return null;
    }
  }

  async isReachable(): Promise<boolean> {
    try {
      await this.panel.getInbounds();

      return true;
    } catch (error) {
      XrayClient.logger.warn(`node ${this.nodeKey} unreachable: ${error}`);

      return false;
    }
  }

  private async isCoreRunning(): Promise<boolean> {
    const body = (await this.panel.getServerStatus()) as XrayApiResponse<XrayServerStatus>;

    return body.success && body.obj?.xray?.state === XRAY_STATE_RUNNING;
  }

  async health(): Promise<boolean> {
    const [inbound, isCoreRunning] = await Promise.all([this.getInbound(), this.isCoreRunning()]);

    return inbound.enable && isCoreRunning;
  }
}

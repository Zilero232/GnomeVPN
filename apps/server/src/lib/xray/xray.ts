import { randomBytes } from 'node:crypto';
import { Logger } from '@nestjs/common';

import { AppServiceUnavailableException } from '../../common/exceptions';
import {
  currentClients,
  generateAuth,
  PanelClient,
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

import type {
  AddWireguardPeerInput,
  CreateClientResult,
  HysteriaClient,
  NewWireguardClientInput,
  SetClientEnabledInput,
  WireguardClient,
  WriteInboundClientsInput,
  XrayClientOptions,
  XrayInbound,
  XrayInboundPayload,
} from './xray.types';

export class XrayClient {
  private static readonly logger = new Logger(XrayClient.name);
  private readonly panel: PanelClient;
  private readonly nodeKey: string;

  constructor(opts: XrayClientOptions) {
    this.nodeKey = opts.baseUrl.replace(/\/$/, '');
    this.panel = new PanelClient({
      baseUrl: this.nodeKey,
      token: opts.token,
      timeout: REQUEST_TIMEOUT_MS,
    });
  }

  private async findInbound(remark: string = INBOUND_REMARK): Promise<XrayInbound | undefined> {
    const inbounds = await this.panel.listInbounds();

    return inbounds.find((inbound) => inbound.remark === remark);
  }

  private async getInbound(remark: string = INBOUND_REMARK): Promise<XrayInbound> {
    const inbound = await this.findInbound(remark);

    if (!inbound) {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', `no inbound remarked ${remark}`);
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
    await this.panel.addInbound(this.inboundPayload(inbound));
  }

  async ensureWireguardInbound(inbound: Record<string, unknown>): Promise<void> {
    return serializeByKey(this.nodeKey, async () => {
      if (await this.hasWireguardInbound()) {
        return;
      }

      await this.panel.addInbound(this.inboundPayload(inbound, WG_INBOUND_REMARK));
    });
  }

  async updateInbound(inbound: Record<string, unknown>): Promise<void> {
    return serializeByKey(this.nodeKey, async () => {
      const current = await this.getInbound();
      const clients = currentClients(current);
      const settings = { ...(inbound.settings as object), clients };

      await this.panel.updateInbound(current.id, this.inboundPayload({ ...inbound, settings }));
    });
  }

  private async writeInboundClients({
    inbound,
    protocol,
    settings,
    remark,
  }: WriteInboundClientsInput): Promise<void> {
    await this.panel.updateInbound(
      inbound.id,
      this.inboundPayload(
        {
          port: inbound.port,
          protocol,
          settings,
          streamSettings: parseStreamSettings(inbound),
          sniffing: parseSniffing(inbound),
        },
        remark,
      ),
    );
  }

  private async writeClients(clients: HysteriaClient[]): Promise<void> {
    const inbound = await this.getInbound();

    await this.writeInboundClients({
      inbound,
      protocol: 'hysteria',
      settings: { ...parseSettings(inbound), clients },
      remark: INBOUND_REMARK,
    });
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
        await this.panel.setClientsEnabled([email], true);

        return { nodeCredential: existing.auth, email };
      }

      const auth = generateAuth();
      await this.writeClients([...clients, this.newClient({ email, auth })]);
      await this.restartCore();

      return { nodeCredential: auth, email };
    });
  }

  async restartCore(): Promise<void> {
    await this.panel.restartCore();
  }

  private async listClients(): Promise<HysteriaClient[]> {
    const inbound = await this.getInbound();

    return (parseSettings(inbound).clients ?? []).filter((client): client is HysteriaClient =>
      Boolean(client?.auth && client?.email),
    );
  }

  async deleteClient(email: string): Promise<void> {
    return serializeByKey(this.nodeKey, () => this.panel.deleteClient(email));
  }

  private async writeWireguardClients(clients: WireguardClient[]): Promise<void> {
    const inbound = await this.getInbound(WG_INBOUND_REMARK);
    const { peers: _legacyPeers, ...current } = parseWireguardSettings(inbound) as Record<
      string,
      unknown
    >;

    await this.writeInboundClients({
      inbound,
      protocol: 'wireguard',
      settings: { ...current, clients },
      remark: WG_INBOUND_REMARK,
    });
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
        throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'wireguard subnet exhausted');
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

  async setClientEnabled({ email, enabled }: SetClientEnabledInput): Promise<void> {
    return serializeByKey(this.nodeKey, () => this.panel.setClientsEnabled([email], enabled));
  }

  async deleteOrphanClients(): Promise<number> {
    return serializeByKey(this.nodeKey, () => this.panel.deleteOrphanClients());
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

  private async isCoreRunning(): Promise<boolean> {
    const status = await this.panel.serverStatus();

    return status.xray?.state === XRAY_STATE_RUNNING;
  }

  async health(): Promise<boolean> {
    const [inbound, isCoreRunning] = await Promise.all([this.getInbound(), this.isCoreRunning()]);

    return inbound.enable && isCoreRunning;
  }
}

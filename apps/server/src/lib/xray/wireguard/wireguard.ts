import { Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { isEmpty } from 'remeda';

import type { Inbounds } from '../inbounds';
import type { PanelClient } from '../panel-client';
import type { AddWireguardPeerInput, NewWireguardClientInput, WireguardClient, WireguardInboundInput } from './wireguard.types';

import { AppServiceUnavailableException } from '../../../common/exceptions';
import { serializeByKey } from '../serialize';
import { parseWireguardSettings, stripCidrMask } from '../xray.helpers';
import { WG_INBOUND_REMARK, WG_PEER_ID_BYTES } from './wireguard.constants';

const newPeer = ({ email, publicKey, assignedIp }: NewWireguardClientInput): WireguardClient => ({
  email,
  id: randomBytes(WG_PEER_ID_BYTES).toString('hex'),
  publicKey,
  allowedIPs: [`${assignedIp}/32`],
  preSharedKey: '',
  enable: true
});

const claimedIps = (clients: WireguardClient[]): string[] => clients.flatMap((client) => client.allowedIPs.map(stripCidrMask));

export class WireguardPeers {
  private static readonly logger = new Logger(WireguardPeers.name);

  constructor(
    private readonly panel: PanelClient,
    private readonly inbounds: Inbounds,
    private readonly nodeKey: string
  ) {}

  async hasInbound(): Promise<boolean> {
    return Boolean(await this.inbounds.find(WG_INBOUND_REMARK));
  }

  async ensureInbound(inbound: WireguardInboundInput): Promise<void> {
    return serializeByKey({
      key: this.nodeKey,
      task: async () => {
        const current = await this.inbounds.find(WG_INBOUND_REMARK);

        if (!current) {
          await this.inbounds.create(inbound, WG_INBOUND_REMARK);

          return;
        }

        const { peers: _legacyPeers, ...existing } = parseWireguardSettings(current);
        const { clients: _fresh, ...incoming } = inbound.settings;

        if (existing.secretKey === incoming.secretKey) {
          return;
        }

        await this.inbounds.writeClients({
          inbound: current,
          protocol: 'wireguard',
          settings: { ...existing, ...incoming },
          remark: WG_INBOUND_REMARK
        });
      }
    });
  }

  async list(): Promise<WireguardClient[]> {
    const inbound = await this.inbounds.find(WG_INBOUND_REMARK);

    if (!inbound) {
      return [];
    }

    return (parseWireguardSettings(inbound).clients ?? []).filter((client): client is WireguardClient =>
      Boolean(client?.email && client?.publicKey && client?.allowedIPs)
    );
  }

  private async write(clients: WireguardClient[]): Promise<void> {
    const inbound = await this.inbounds.get(WG_INBOUND_REMARK);
    const { peers: _legacyPeers, ...current } = parseWireguardSettings(inbound) as Record<string, unknown>;

    await this.inbounds.writeClients({
      inbound,
      protocol: 'wireguard',
      settings: { ...current, clients },
      remark: WG_INBOUND_REMARK
    });
  }

  async add({ email, publicKey, takenIps, allocateIp }: AddWireguardPeerInput): Promise<string> {
    return serializeByKey({
      key: this.nodeKey,
      task: async () => {
        const clients = await this.list();
        const reused = clients.find((client) => client.email === email);
        const reusedIps = new Set((reused?.allowedIPs ?? []).map(stripCidrMask));

        const claimed = [...takenIps, ...claimedIps(clients)].filter((ip) => !reusedIps.has(ip));
        const assignedIp = allocateIp(claimed);

        if (!assignedIp) {
          throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'wireguard subnet exhausted');
        }

        const peer = newPeer({ email, publicKey, assignedIp });

        const conflictsWithPeer = (client: WireguardClient) =>
          client.email === peer.email || client.publicKey === peer.publicKey || client.allowedIPs.some((ip) => peer.allowedIPs.includes(ip));

        const evicted = clients.filter((client) => client.email !== peer.email && conflictsWithPeer(client));

        if (!isEmpty(evicted)) {
          WireguardPeers.logger.error(
            `wireguard peer ${email} collides with ${evicted.map((client) => client.email).join(', ')} on ${this.nodeKey} — those clients would be evicted; aborting to avoid orphaning them`
          );

          throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'wireguard client collision on the node');
        }

        const kept = clients.filter((client) => !conflictsWithPeer(client));

        await this.write([...kept, peer]);
        await this.panel.restartCore();

        return assignedIp;
      }
    });
  }
}

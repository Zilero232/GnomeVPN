import { parseIniValue } from './wg-easy-ini';

import type { CreateClientResult, WgEasyClientRow } from './wg-easy.types';

export class WgEasyClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(opts: { baseUrl: string; apiKey: string }) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.apiKey = opts.apiKey;
  }

  private headers(): HeadersInit {
    return { 'Content-Type': 'application/json', Authorization: this.apiKey };
  }

  private async listClients(): Promise<WgEasyClientRow[]> {
    const res = await fetch(`${this.baseUrl}/api/wireguard/client`, { headers: this.headers() });

    if (!res.ok) {
      throw new Error(`wg-easy listClients failed: ${res.status}`);
    }

    return (await res.json()) as WgEasyClientRow[];
  }

  private async getConfiguration(clientId: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/wireguard/client/${clientId}/configuration`, {
      headers: this.headers(),
    });

    if (!res.ok) {
      throw new Error(`wg-easy getConfiguration failed: ${res.status}`);
    }

    return res.text();
  }

  async createClient(name: string): Promise<CreateClientResult> {
    const res = await fetch(`${this.baseUrl}/api/wireguard/client`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      throw new Error(`wg-easy createClient failed: ${res.status}`);
    }

    const created = (await this.listClients()).findLast((row) => row.name === name);

    if (!created) {
      throw new Error('wg-easy createClient failed: client not found after creation');
    }

    const config = await this.getConfiguration(created.id);
    const privateKey = parseIniValue(config, 'Interface', 'PrivateKey');
    const address = parseIniValue(config, 'Interface', 'Address');
    const dns = parseIniValue(config, 'Interface', 'DNS');
    const serverPublicKey = parseIniValue(config, 'Peer', 'PublicKey');
    const presharedKey = parseIniValue(config, 'Peer', 'PresharedKey');

    if (!privateKey || !address || !dns || !serverPublicKey) {
      throw new Error('wg-easy createClient failed: incomplete configuration');
    }

    return { clientId: created.id, privateKey, address, serverPublicKey, presharedKey, dns };
  }

  async deleteClient(clientId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/wireguard/client/${clientId}`, {
      method: 'DELETE',
      headers: this.headers(),
    });

    if (!res.ok && res.status !== 404) {
      throw new Error(`wg-easy deleteClient failed: ${res.status}`);
    }
  }

  async getClientHandshake(clientId: string): Promise<Date | null> {
    try {
      const row = (await this.listClients()).find((client) => client.id === clientId);

      return row?.latestHandshakeAt ? new Date(row.latestHandshakeAt) : null;
    } catch {
      return null;
    }
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/release`, { headers: this.headers() });
      return res.ok;
    } catch {
      return false;
    }
  }
}

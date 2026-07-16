type CreateClientResult = {
  clientId: string;
  privateKey: string;
  address: string;
  serverPublicKey: string;
  dns: string;
};

export class WgEasyClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(opts: { baseUrl: string; apiKey: string }) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.apiKey = opts.apiKey;
  }

  private headers(): HeadersInit {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` };
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
    const data = (await res.json()) as {
      id: string;
      privateKey: string;
      address: string;
      serverPublicKey: string;
      dns: string;
    };
    return {
      clientId: data.id,
      privateKey: data.privateKey,
      address: data.address,
      serverPublicKey: data.serverPublicKey,
      dns: data.dns,
    };
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
    const res = await fetch(`${this.baseUrl}/api/wireguard/client/${clientId}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as { latestHandshakeAt?: string | null };
    return data.latestHandshakeAt ? new Date(data.latestHandshakeAt) : null;
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

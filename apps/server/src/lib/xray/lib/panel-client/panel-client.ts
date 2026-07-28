import { AppServiceUnavailableException } from '../../../../common/exceptions';
import { PANEL_ROUTES } from './panel-client.constants';

import type {
  PanelClientInput,
  PanelInbound,
  PanelResponse,
  PanelServerStatus,
} from './panel-client.types';

export class PanelClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeout: number;

  constructor({ baseUrl, token, timeout }: PanelClientInput) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
    this.timeout = timeout;
  }

  private async send<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new AppServiceUnavailableException(
          'NODE_UNAVAILABLE',
          `panel ${path} returned ${response.status}`,
        );
      }

      const payload = (await response.json()) as PanelResponse<T>;

      if (!payload.success) {
        throw new AppServiceUnavailableException(
          'NODE_UNAVAILABLE',
          `panel ${path}: ${payload.msg}`,
        );
      }

      return payload.obj;
    } finally {
      clearTimeout(timer);
    }
  }

  private get<T>(path: string): Promise<T> {
    return this.send<T>('GET', path);
  }

  private post<T>(path: string, body?: unknown): Promise<T> {
    return this.send<T>('POST', path, body);
  }

  listInbounds(): Promise<PanelInbound[]> {
    return this.get(PANEL_ROUTES.listInbounds);
  }

  async addInbound(payload: unknown): Promise<void> {
    await this.post(PANEL_ROUTES.addInbound, payload);
  }

  async updateInbound(id: number, payload: unknown): Promise<void> {
    await this.post(PANEL_ROUTES.updateInbound(id), payload);
  }

  async restartCore(): Promise<void> {
    await this.post(PANEL_ROUTES.restartCore);
  }

  serverStatus(): Promise<PanelServerStatus> {
    return this.get(PANEL_ROUTES.serverStatus);
  }

  async deleteClient(email: string): Promise<void> {
    await this.post(PANEL_ROUTES.deleteClient(email));
  }

  async deleteOrphanClients(): Promise<number> {
    const result = await this.post<{ deleted: number }>(PANEL_ROUTES.deleteOrphans);

    return result.deleted ?? 0;
  }

  async setClientsEnabled(emails: string[], enabled: boolean): Promise<void> {
    if (emails.length === 0) {
      return;
    }

    await this.post(PANEL_ROUTES.setEnabled(enabled), { emails });
  }
}

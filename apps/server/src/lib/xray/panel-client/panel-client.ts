import { isEmpty } from 'remeda';

import type {
  AddClientInput,
  AddPanelClientInput,
  AddVlessClientInput,
  PanelClientInput,
  PanelInbound,
  PanelOnlines,
  PanelResponse,
  PanelServerStatus,
  SetClientsEnabledInput,
  UpdateInboundInput
} from './panel-client.types';

import { AppServiceUnavailableException } from '../../../common/exceptions';
import { VLESS_FLOW } from '../vless/vless.constants';
import { CLIENT_DEFAULTS, PANEL_ROUTES } from './panel-client.constants';
import { collectOnlineEmails } from './panel-client.helpers';

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
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      signal: AbortSignal.timeout(this.timeout),
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', `panel ${path} returned ${response.status}`);
    }

    const payload = (await response.json()) as PanelResponse<T>;

    if (!payload.success) {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', `panel ${path}: ${payload.msg}`);
    }

    return payload.obj;
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

  async updateInbound({ id, payload }: UpdateInboundInput): Promise<void> {
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

  private async addPanelClient({ inboundId, client }: AddPanelClientInput): Promise<void> {
    await this.post(PANEL_ROUTES.addClient, {
      inboundIds: [inboundId],
      client: { ...client, ...CLIENT_DEFAULTS }
    });
  }

  async addClient({ inboundId, email, auth }: AddClientInput): Promise<void> {
    await this.addPanelClient({ inboundId, client: { email, auth } });
  }

  async addVlessClient({ inboundId, email, id }: AddVlessClientInput): Promise<void> {
    await this.addPanelClient({ inboundId, client: { email, id, flow: VLESS_FLOW } });
  }

  async setClientsEnabled({ emails, enabled }: SetClientsEnabledInput): Promise<void> {
    if (isEmpty(emails)) {
      return;
    }

    await this.post(PANEL_ROUTES.setEnabled(enabled), { emails });
  }

  async onlineEmails(): Promise<Set<string> | null> {
    const payload = await this.post<PanelOnlines>(PANEL_ROUTES.onlines);

    return collectOnlineEmails(payload);
  }
}

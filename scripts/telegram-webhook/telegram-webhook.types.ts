export type WebhookConfig = {
  token: string;
  secret: string;
  apiUrl: string;
};

export type TelegramResponse = {
  ok: boolean;
  description?: string;
  result?: unknown;
};

export type CallInput = {
  token: string;
  method: string;
  body?: Record<string, string>;
};

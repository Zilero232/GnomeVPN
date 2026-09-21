import { reporter } from '@gnomevpn/scripts/reporter';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isArray, isObjectType, isString } from 'remeda';

import type { CallInput, TelegramResponse, WebhookConfig } from './telegram-webhook.types';

import { readEnvValue } from '../provision/node/env-file';
import { REQUEST_TIMEOUT_MS, TELEGRAM_API, WEBHOOK_PATH } from './telegram-webhook.constants';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const ENV_PATH = resolve(ROOT, '.env');

const log = reporter('telegram');

// fetch hands back `unknown`, and Telegram's own errors arrive as a 200 with
// `ok: false` — so the shape is checked rather than asserted.
const isRecord = (payload: unknown): payload is Record<string, unknown> => isObjectType(payload) && !isArray(payload);

const readResponse = (payload: unknown): TelegramResponse => {
  if (!isRecord(payload)) {
    return { ok: false, description: 'the response was not a Telegram payload' };
  }

  const description = payload.description;

  return {
    ok: payload.ok === true,
    description: isString(description) ? description : undefined,
    result: payload.result
  };
};

// api.telegram.org is blocked by most Russian ISPs, so a timeout here says
// nothing about the bot — it says the request never left the country.
const call = async ({ token, method, body }: CallInput): Promise<TelegramResponse> => {
  try {
    const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    return readResponse(await response.json());
  } catch {
    return log.fail('api.telegram.org did not answer. It is blocked by most Russian ISPs — run this behind a VPN, or from the production server.');
  }
};

const loadConfig = async (): Promise<WebhookConfig> => {
  const token = await readEnvValue({ filePath: ENV_PATH, key: 'TELEGRAM_BOT_TOKEN' });
  const secret = await readEnvValue({ filePath: ENV_PATH, key: 'TELEGRAM_WEBHOOK_SECRET' });
  const apiUrl = await readEnvValue({ filePath: ENV_PATH, key: 'API_URL' });

  if (!token) {
    log.fail('TELEGRAM_BOT_TOKEN is empty in .env — create the bot with @BotFather first');
  }

  if (!secret) {
    log.fail('TELEGRAM_WEBHOOK_SECRET is empty in .env — run `bun run secrets`');
  }

  return { token: token ?? '', secret: secret ?? '', apiUrl: apiUrl ?? '' };
};

// The URL is taken from the argument when given and from API_URL otherwise, so
// a tunnel for local testing is one argument rather than an edit to .env.
const resolveUrl = (apiUrl: string): string => {
  const named = process.argv.slice(2).find((argument) => argument.startsWith('http'));
  const base = named ?? apiUrl;

  if (!base) {
    log.fail('no URL: pass one as an argument, or set API_URL in .env');
  }

  if (base.includes('localhost') || base.includes('127.0.0.1')) {
    log.fail(`${base} is not reachable from Telegram. Use a tunnel: npx cloudflared tunnel --url ${base}`);
  }

  return `${base.replace(/\/$/u, '')}${WEBHOOK_PATH}`;
};

const show = async (token: string) => {
  const info = await call({ token, method: 'getWebhookInfo' });

  log.info(JSON.stringify(info.result, null, 2));
};

const run = async () => {
  const { token, secret, apiUrl } = await loadConfig();

  if (process.argv.includes('--info')) {
    await show(token);

    return;
  }

  if (process.argv.includes('--delete')) {
    const deleted = await call({ token, method: 'deleteWebhook' });

    log.info(deleted.ok ? 'webhook removed' : `could not remove it: ${deleted.description ?? 'no reason given'}`);

    return;
  }

  const url = resolveUrl(apiUrl);
  const result = await call({ token, method: 'setWebhook', body: { url, secret_token: secret } });

  if (!result.ok) {
    log.fail(`Telegram refused it: ${result.description ?? 'no reason given'}`);
  }

  log.info(`webhook set to ${url}`);
};

await run();

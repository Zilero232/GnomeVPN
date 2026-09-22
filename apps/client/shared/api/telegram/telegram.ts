import type { TelegramLinkCode, TelegramStatus, TelegramWebLogin, TelegramWidget } from '@gnomevpn/schemas';

import { api } from '../http';

export const getTelegramStatus = async (): Promise<TelegramStatus> => {
  const { data } = await api.get('/telegram');

  return data;
};

export const issueTelegramCode = async (): Promise<TelegramLinkCode> => {
  const { data } = await api.post('/telegram/code');

  return data;
};

export const unlinkTelegram = async (): Promise<void> => {
  await api.delete('/telegram');
};

export const redeemTelegramLogin = async (code: string): Promise<TelegramWebLogin> => {
  const { data } = await api.post('/telegram/web-login', { code });

  return data;
};

export const getTelegramWidget = async (): Promise<TelegramWidget> => {
  const { data } = await api.get('/telegram/web-login');

  return data;
};

export const signInWithTelegram = async (payload: Record<string, string>): Promise<TelegramWebLogin> => {
  const { data } = await api.post('/telegram/web-login/widget', payload);

  return data;
};

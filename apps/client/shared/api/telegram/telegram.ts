import type { TelegramLinkCode, TelegramStatus } from '@gnomevpn/schemas';

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

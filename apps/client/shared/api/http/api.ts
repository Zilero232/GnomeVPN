import axios from 'axios';

import { env } from '@/shared/config';
import { getAuthToken, saveAuthToken } from '../auth/auth-client';
import { toApiError } from './api-error';

export const api = axios.create({ baseURL: env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const readErrorBody = async (data: unknown): Promise<unknown> => {
  if (!(data instanceof Blob)) {
    return data;
  }

  try {
    return JSON.parse(await data.text());
  } catch {
    return null;
  }
};

api.interceptors.response.use((response) => {
  saveAuthToken(response.headers['set-auth-token'] ?? null);

  return response;
});

api.interceptors.response.use(undefined, async (error) => {
  if (axios.isAxiosError(error)) {
    const apiError = toApiError(await readErrorBody(error.response?.data));

    if (apiError) {
      return Promise.reject(apiError);
    }
  }

  return Promise.reject(error);
});

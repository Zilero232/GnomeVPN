import type { DownloadedConfig, IssueConfigRequest } from '@gnomevpn/schemas';

import type { ConfigDownload } from './configs.types';

import { api } from '../http';
import { parseFileName } from './configs.lib';

export const listConfigs = async (): Promise<DownloadedConfig[]> => {
  const { data } = await api.get('/configs');

  return data;
};

export const issueConfig = async (input: IssueConfigRequest): Promise<ConfigDownload> => {
  const response = await api.post('/configs', input, { responseType: 'blob' });

  return {
    blob: response.data as Blob,
    fileName: parseFileName(response.headers['content-disposition'])
  };
};

export const revokeConfig = async (id: string): Promise<void> => {
  await api.delete('/configs', { data: { id } });
};

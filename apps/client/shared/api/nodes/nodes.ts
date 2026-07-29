import type { Node, NodeEndpoint } from '@gnomevpn/schemas';

import { api } from '../http';

export const listNodes = async (): Promise<Node[]> => {
  const { data } = await api.get('/nodes');

  return data;
};

export const listNodeEndpoints = async (): Promise<NodeEndpoint[]> => {
  const { data } = await api.get('/nodes/endpoints');

  return data;
};

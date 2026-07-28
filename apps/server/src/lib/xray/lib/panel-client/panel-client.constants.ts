const INBOUNDS = '/panel/api/inbounds';
const SERVER = '/panel/api/server';
const CLIENTS = '/panel/api/clients';

export const PANEL_ROUTES = {
  listInbounds: `${INBOUNDS}/list`,
  addInbound: `${INBOUNDS}/add`,
  updateInbound: (id: number) => `${INBOUNDS}/update/${id}`,
  restartCore: `${SERVER}/restartXrayService`,
  serverStatus: `${SERVER}/status`,
  clientTraffic: (email: string) => `${CLIENTS}/traffic/${encodeURIComponent(email)}`,
  deleteClient: (email: string) => `${CLIENTS}/del/${encodeURIComponent(email)}`,
  deleteOrphans: `${CLIENTS}/delOrphans`,
  setEnabled: (enabled: boolean) => `${CLIENTS}/${enabled ? 'bulkEnable' : 'bulkDisable'}`,
} as const;

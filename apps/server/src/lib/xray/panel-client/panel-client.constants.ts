export const NO_LIMIT = 0;

export const CLIENT_DEFAULTS = {
  enable: true,
  totalGB: NO_LIMIT,
  expiryTime: NO_LIMIT,
  tgId: NO_LIMIT,
  reset: NO_LIMIT
} as const;

const INBOUNDS = '/panel/api/inbounds';
const SERVER = '/panel/api/server';
const CLIENTS = '/panel/api/clients';

export const PANEL_ROUTES = {
  listInbounds: `${INBOUNDS}/list`,
  addInbound: `${INBOUNDS}/add`,
  updateInbound: (id: number) => `${INBOUNDS}/update/${id}`,
  restartCore: `${SERVER}/restartXrayService`,
  serverStatus: `${SERVER}/status`,
  onlines: `${CLIENTS}/onlines`,
  addClient: `${CLIENTS}/add`,
  deleteClient: (email: string) => `${CLIENTS}/del/${encodeURIComponent(email)}`,
  setEnabled: (enabled: boolean) => `${CLIENTS}/${enabled ? 'bulkEnable' : 'bulkDisable'}`
} as const;

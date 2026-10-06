import { NODE_ENV_PREFIX, nodeKeyName, panelPasswordName, panelPathName } from '../node-credentials';

export const PRUNED_SECRETS = [
  { prefix: NODE_ENV_PREFIX.apiKey, name: nodeKeyName },
  { prefix: NODE_ENV_PREFIX.panelPassword, name: panelPasswordName },
  { prefix: NODE_ENV_PREFIX.panelPath, name: panelPathName }
] as const;

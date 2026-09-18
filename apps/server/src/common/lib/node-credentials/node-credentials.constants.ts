export const NODE_ACCESS_SELECT = {
  apiUrl: true,
  apiTokenEnvVar: true
} as const;

export const IDENTIFIED_NODE_SELECT = {
  id: true,
  ...NODE_ACCESS_SELECT
} as const;

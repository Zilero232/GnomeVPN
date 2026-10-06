export const NODE_ENV_PREFIX = {
  apiKey: 'XRAY_KEY_',
  panelPassword: 'XRAY_PANEL_',
  panelPath: 'XRAY_PATH_'
} as const;

export const CREDENTIAL_BYTES = {
  password: 16,
  panelPath: 8
} as const;

const SECRETS_DIR = '/etc/gnomevpn';

export const NODE_FILES = {
  dir: SECRETS_DIR,
  cert: `${SECRETS_DIR}/cert.pem`,
  key: `${SECRETS_DIR}/key.pem`,
  realityKey: `${SECRETS_DIR}/reality.key`,
  realityPub: `${SECRETS_DIR}/reality.pub`,
  realitySid: `${SECRETS_DIR}/reality.sid`
} as const;

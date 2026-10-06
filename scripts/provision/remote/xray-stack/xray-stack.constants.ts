const REMOTE_DIR = '/opt/gnomevpn-xray';

export const XRAY_STACK = {
  remoteDir: REMOTE_DIR,
  composeFile: `${REMOTE_DIR}/docker-compose.yml`
} as const;

export const CONTAINER_NAME = 'gnomevpn-xray';

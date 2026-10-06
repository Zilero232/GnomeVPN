export const SSH_CONNECT = {
  readyTimeoutMs: 60_000,
  retries: 3,
  minBackoffMs: 3_000
} as const;

export const SSH_UPLOAD = {
  tempPrefix: 'gnomevpn-ssh-put-',
  payloadName: 'payload'
} as const;

export const SIGNALLED_EXIT_CODE = 128;

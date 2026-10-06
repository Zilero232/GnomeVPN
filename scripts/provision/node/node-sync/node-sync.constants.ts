export const PRODUCTION_SSH = {
  defaultUser: 'root',
  defaultDeployPath: '/opt/gnomevpn',
  keyNames: ['gnomevpn_deploy', 'id_ed25519', 'id_rsa', 'id_ecdsa']
} as const;

export const HEREDOC_NONCE_BYTES = 8;

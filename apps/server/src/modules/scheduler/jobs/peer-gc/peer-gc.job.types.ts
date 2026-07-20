export type PeerRow = {
  id: string;
  wgEasyClientId: string;
  createdAt: Date;
  lastHandshakeAt: Date | null;
  node: { wgEasyUrl: string; wgEasyApiKeyEnvVar: string };
};

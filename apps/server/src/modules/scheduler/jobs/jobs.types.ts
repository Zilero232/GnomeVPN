export type PeerRow = {
  id: string;
  wgEasyClientId: string;
  createdAt: Date;
  lastHandshakeAt: Date | null;
  node: { wgEasyUrl: string; wgEasyApiKeyRef: string };
};

export type PeerAccessRow = {
  userId: string;
  user: {
    subscription: { status: string; currentPeriodEnd: Date | null } | null;
  };
};

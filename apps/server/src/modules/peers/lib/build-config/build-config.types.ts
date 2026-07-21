export type TunnelNode = {
  host: string;
  port: number;
  realityServerName: string;
  realityPublicKey: string;
  realityShortId: string;
};

export type BuildConfigInput = {
  node: TunnelNode;
  xrayUserId: string;
};

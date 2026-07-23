export type TunnelNode = {
  host: string;
  port: number;
  serverName: string;
};

export type BuildConfigInput = {
  node: TunnelNode;
  auth: string;
};

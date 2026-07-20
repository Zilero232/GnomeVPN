export type ConfigFile = {
  fileName: string;
  content: string;
};

export type IssueConfigInput = {
  userId: string;
  nodeId: string;
  name: string;
};

export type PeerRef = {
  nodeId: string;
  wgEasyClientId: string;
};

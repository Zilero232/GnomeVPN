export type ConfigFile = {
  fileName: string;
  content: string;
};

export type IssueConfigInput = {
  userId: string;
  nodeId: string;
  name: string;
};

export type RevokeConfigInput = {
  userId: string;
  id: string;
};

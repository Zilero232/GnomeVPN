export type NodeAccess = {
  apiUrl: string;
  apiTokenEnvVar: string;
};

export type IdentifiedNode = NodeAccess & {
  id: string;
};

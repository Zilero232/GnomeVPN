export type SyncableNode = {
  country: string;
  countryCode: string;
  city: string | null;
  host: string;
  port: number;
  realityServerName: string;
  realityPublicKey: string;
  realityShortId: string;
  apiUrl: string;
  apiTokenEnvVar: string;
  displayOrder: number;
};

export type SyncToProductionInput = {
  nodes: SyncableNode[];
  envNodes: string;
};

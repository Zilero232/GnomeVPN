type NodeRow = { id: string };

export type PrismaLike = {
  node: {
    findFirst: (args: { where: { publicEndpoint: string } }) => Promise<NodeRow | null>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<NodeRow>;
    create: (args: { data: Record<string, unknown> }) => Promise<NodeRow>;
  };
};

export type UpsertNodeInput = {
  country: string;
  countryCode: string;
  city?: string;
  publicEndpoint: string;
  wgEasyUrl: string;
  wgEasyApiKeyRef: string;
};

export type UpsertNodeResult = {
  id: string;
  wasExisting: boolean;
};

type NodeRow = { id: string };

export type PrismaLike = {
  node: {
    findFirst: (args: { where: { host: string } }) => Promise<NodeRow | null>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<NodeRow>;
    create: (args: { data: Record<string, unknown> }) => Promise<NodeRow>;
  };
};

export type UpsertNodeInput = {
  country: string;
  countryCode: string;
  city?: string;
  host: string;
  port: number;
  realityServerName: string;
  realityPublicKey: string;
  realityShortId: string;
  apiUrl: string;
  apiTokenEnvVar: string;
};

export type UpsertNodeResult = {
  id: string;
  wasExisting: boolean;
};

export type UpsertNodeArgs = {
  prisma: PrismaLike;
  input: UpsertNodeInput;
};

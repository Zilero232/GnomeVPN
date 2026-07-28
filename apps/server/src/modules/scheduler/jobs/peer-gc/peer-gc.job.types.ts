export type PeerRow = {
  id: string;
  userId: string;
  name: string | null;
  createdAt: Date;
  lastActiveAt: Date | null;
  node: { apiUrl: string; apiTokenEnvVar: string };
};

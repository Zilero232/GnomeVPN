export type BuildRealityInboundInput = {
  privateKey: string;
  shortId: string;
};

export type EnsuredRealityKeys = {
  privateKey: string;
  publicKey: string;
  shortId: string;
  wasGenerated: boolean;
};

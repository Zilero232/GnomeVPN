export type EnsuredRealityKeys = {
  privateKey: string;
  publicKey: string;
  shortId: string;
  wasGenerated: boolean;
};

export type RealityKeySeed = {
  path: string;
  value: string;
};

export type SeedRealityKeysScriptInput = {
  dir: string;
  seed: RealityKeySeed[];
};

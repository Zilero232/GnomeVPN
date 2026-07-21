export type EnvKeyInput = {
  filePath: string;
  key: string;
};

export type AppendEnvLineInput = EnvKeyInput & {
  value: string;
};

export type PruneEnvKeysInput = {
  filePath: string;
  prefix: string;
  keep: string[];
};

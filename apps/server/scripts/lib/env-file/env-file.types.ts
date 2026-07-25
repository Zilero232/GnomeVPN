export type EnvKeyInput = {
  filePath: string;
  key: string;
};

export type EnvEntry = {
  key: string;
  value: string;
};

export type UpsertEnvGroupInput = {
  filePath: string;
  entries: EnvEntry[];
};

export type PruneEnvKeysInput = {
  filePath: string;
  prefix: string;
  keep: string[];
};

export type FindValueInput = {
  raw: string;
  key: string;
};

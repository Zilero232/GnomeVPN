import type { SECRET_ENCODINGS } from './secrets.constants';

export type SecretKey = keyof typeof SECRET_ENCODINGS;

export type GenerateInput = {
  envPath: string;
  keys: SecretKey[];
  isForced: boolean;
};

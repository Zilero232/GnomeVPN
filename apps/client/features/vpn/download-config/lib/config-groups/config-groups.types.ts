import type { ConfigWithStatus } from '../config-status';

export type ConfigCountry = {
  code: string;
  count: number;
  name: string;
};

export type VisibleConfigsInput = {
  configs: ConfigWithStatus[];
  filter: string;
  hasFilter: boolean;
};

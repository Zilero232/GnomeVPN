import type { SshClient } from '@gnomevpn/scripts/ssh';
import type { z } from 'zod';

export type ConfigurePanelInput = {
  ssh: SshClient;
  password: string;
  panelPath: string;
};

export type WaitForPanelInput = {
  ssh: SshClient;
  panelPath: string;
};

export type KeepCoreRunningInput = {
  ssh: SshClient;
  panelPath: string;
  token: string;
};

export type ParsePanelReplyInput<Schema extends z.ZodType> = {
  raw: string;
  schema: Schema;
  action: string;
};

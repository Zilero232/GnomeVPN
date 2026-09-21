import type { SshClient } from '@gnomevpn/scripts/ssh';

export type PrepareHostInput = {
  ssh: SshClient;
  xrayComposeContent: string;
};

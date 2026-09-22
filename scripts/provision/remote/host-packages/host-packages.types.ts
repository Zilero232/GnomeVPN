import type { SshClient } from '@gnomevpn/scripts/ssh';

export type IsInstalledInput = {
  ssh: SshClient;
  probe: string;
};

export type EnsureAptInput = {
  ssh: SshClient;
  name: string;
  probe: string;
};

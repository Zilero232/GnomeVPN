import type { SshClient } from '@gnomevpn/scripts/ssh';

export type ShipStackInput = {
  ssh: SshClient;
  composeContent: string;
};

import type { ConfigWithStatus } from '../../../model/hooks';

export type ConfigRowProps = {
  config: ConfigWithStatus;
  isBlocked?: boolean;
  isRevoking: boolean;
  onRevoke: () => void;
};

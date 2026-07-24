import type { useSplitTunneling } from '../../model/hooks';

export type SplitTunnelingDialogProps = {
  isConnected: boolean;
  isOpen: boolean;
  splitTunneling: ReturnType<typeof useSplitTunneling>;
  onOpenChange: (isOpen: boolean) => void;
};

import type { AvailableUpdate } from '../../../model/hooks';

export type UpdateDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  update: AvailableUpdate;
};

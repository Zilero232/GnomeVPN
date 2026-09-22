export type DeleteAccountDialogProps = {
  isOpen: boolean;
  isPending: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
};

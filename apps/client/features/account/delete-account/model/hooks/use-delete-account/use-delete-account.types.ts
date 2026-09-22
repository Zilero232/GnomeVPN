export type DeleteAccountState = {
  isOpen: boolean;
  isPending: boolean;
  open: () => void;
  close: () => void;
  confirm: () => void;
};

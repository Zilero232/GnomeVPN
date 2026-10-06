import type { ReactNode } from 'react';

export type ConfirmDialogProps = {
  isOpen: boolean;
  isPending: boolean;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: ReactNode;
  cancelLabel: ReactNode;
  tone?: 'danger' | 'primary';
  className?: string;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
};

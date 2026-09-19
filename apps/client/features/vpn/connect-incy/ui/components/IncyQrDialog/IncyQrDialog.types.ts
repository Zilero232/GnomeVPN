export type QrKind = 'incy' | 'url';

export type IncyQrDialogProps = {
  deepLink: string;
  url: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

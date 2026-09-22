export type TelegramLinkedProps = {
  bot: string;
  username: string | null;
  hasEmail: boolean;
  isPending: boolean;
  onUnlink: () => void;
};

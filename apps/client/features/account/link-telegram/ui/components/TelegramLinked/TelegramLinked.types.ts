export type TelegramLinkedProps = {
  bot: string;
  username: string | null;
  isPending: boolean;
  onUnlink: () => void;
};

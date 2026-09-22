import type { RefObject } from 'react';

export type TelegramWidgetUser = {
  id: number;
  first_name: string;
  auth_date: number;
  hash: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type WidgetScriptInput = {
  botUsername: string;
  onError: () => void;
};

export type TelegramLoginState = {
  slotRef: RefObject<HTMLDivElement | null>;
  isUnreachable: boolean;
  isPending: boolean;
  isError: boolean;
};

declare global {
  // eslint-disable-next-line ts/consistent-type-definitions -- declaration merging onto the DOM's Window needs an interface
  interface Window {
    onTelegramAuth?: (user: TelegramWidgetUser) => void;
  }
}

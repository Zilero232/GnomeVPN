export type TelegramLoginUser = {
  id: number;
  name?: string;
  preferred_username?: string;
  picture?: string;
};

export type TelegramLoginResult = {
  id_token?: string;
  user?: TelegramLoginUser;
  error?: string;
};

export type TelegramLoginOptions = {
  client_id: number;
  scope: string[];
  lang?: string;
};

export type TelegramLoginState = {
  isReady: boolean;
  isPending: boolean;
  isError: boolean;
  onScriptLoad: () => void;
  onScriptError: () => void;
  signIn: () => void;
};

declare global {
  // eslint-disable-next-line ts/consistent-type-definitions -- declaration merging onto the DOM's Window needs an interface
  interface Window {
    Telegram?: {
      Login?: {
        auth: (options: TelegramLoginOptions, callback: (result: TelegramLoginResult) => void) => void;
      };
    };
  }
}

export type WidgetPayload = Record<string, string>;

export type VerifyWidgetInput = {
  payload: WidgetPayload;
  botToken: string;
  now?: Date;
};

export type IsFreshInput = {
  authDate: string;
  now: Date;
};

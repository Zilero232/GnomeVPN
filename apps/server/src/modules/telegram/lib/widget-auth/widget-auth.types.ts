export type WidgetPayload = Record<string, string>;

export type VerifyWidgetInput = {
  payload: WidgetPayload;
  botToken: string;
  now?: Date;
};

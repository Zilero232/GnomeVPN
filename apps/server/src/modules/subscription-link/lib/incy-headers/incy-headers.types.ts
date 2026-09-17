export type IncyHeadersInput = {
  currentPeriodEnd: Date | null;
  clientUrl: string;
  supportUrl: string | null;
  announce: string | null;
};

export type IncyHeaders = Record<string, string>;

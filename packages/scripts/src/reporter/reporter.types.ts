export type LogFields = Record<string, unknown>;

export type Reporter = {
  info: (message: string, fields?: LogFields) => void;
  step: (message: string, fields?: LogFields) => void;
  warn: (message: string, fields?: LogFields) => void;
  fail: (message: string, code?: number) => never;
};

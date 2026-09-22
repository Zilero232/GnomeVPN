export type LogFields = Record<string, unknown>;

export type ColorForInput = {
  key: string;
  taken: Map<string, string>;
};

export type PaintInput = {
  message: string;
  color: string | undefined;
};

export type Reporter = {
  info: (message: string, fields?: LogFields) => void;
  step: (message: string, fields?: LogFields) => void;
  done: (message: string, fields?: LogFields) => void;
  warn: (message: string, fields?: LogFields) => void;
  fail: (message: string, code?: number) => never;
  tint: (key: string) => void;
  untint: () => void;
};

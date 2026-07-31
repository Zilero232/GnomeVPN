export type Reporter = {
  info: (message: string) => void;
  step: (message: string) => void;
  warn: (message: string) => void;
  fail: (message: string, code?: number) => never;
};

export type LogFields = Record<string, unknown>;

export type LogFn = (message: string, fields?: LogFields) => void;

export type Logger = Record<'debug' | 'error' | 'info' | 'warn', LogFn>;

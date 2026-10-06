export const SHELL = {
  bareToken: /^[\w%+,./:=@-]+$/,
  escapedQuote: String.raw`'\''`
} as const;

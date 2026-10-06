export const SERVICE_NAME = 'gnomevpn-provision';

export const PRETTY_FORMAT = {
  ignore: 'scope',
  messageFormat: '[{scope}] {msg}'
} as const;

export const SCOPE_COLOR = {
  palette: ['\u001B[36m', '\u001B[35m', '\u001B[33m', '\u001B[32m', '\u001B[34m', '\u001B[31m'],
  reset: '\u001B[39m'
} as const;

export const MARK = {
  step: '→ ',
  done: '  '
} as const;

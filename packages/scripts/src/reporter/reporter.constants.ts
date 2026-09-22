export const SERVICE_NAME = 'gnomevpn-provision';

// A provisioning run is read by a person as it happens, so the terminal keeps
// the `[scope] message` shape the scripts have always printed.
export const PRETTY_FORMAT = {
  ignore: 'scope',
  messageFormat: '[{scope}] {msg}'
};

// One escape per hue, picked to stay legible on both a dark and a light
// terminal. They are handed out round-robin, so the count is what decides how
// many scopes run before two of them share a colour.
export const SCOPE_COLORS = ['\u001B[36m', '\u001B[35m', '\u001B[33m', '\u001B[32m', '\u001B[34m', '\u001B[31m'] as const;

export const RESET_COLOR = '\u001B[39m';

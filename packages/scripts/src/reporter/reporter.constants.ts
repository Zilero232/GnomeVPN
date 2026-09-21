export const SERVICE_NAME = 'gnomevpn-provision';

// A provisioning run is read by a person as it happens, so the terminal keeps
// the `[scope] message` shape the scripts have always printed.
export const PRETTY_FORMAT = {
  ignore: 'scope',
  messageFormat: '[{scope}] {msg}'
};

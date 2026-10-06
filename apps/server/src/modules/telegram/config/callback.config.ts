export const CALLBACK_PREFIX = {
  plan: 'plan:',
  locale: 'locale:',
  client: 'client:',
  unlink: 'unlink:',
  rotate: 'rotate:',
  autoRenew: 'renew:',
  devices: 'devices:',
  forgetDevice: 'forget:',
  removeDevice: 'remove:',
  deleteAccount: 'delete:'
} as const;

export const CONFIRMED = 'yes';

export const DECLINED = 'no';

export const SUBJECT_SEPARATOR = ':';

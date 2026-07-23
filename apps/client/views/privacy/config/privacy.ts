export const PRIVACY_UPDATED = '2026-07-24';

export const PRIVACY_SECTIONS = [
  'collect',
  'noLogs',
  'payments',
  'storage',
  'thirdParty',
  'rights',
  'children',
  'changes',
  'contact',
] as const;

export type PrivacySection = (typeof PRIVACY_SECTIONS)[number];

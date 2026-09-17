export const FAQ_GROUPS = [
  { key: 'start', questions: ['whatIsIncy', 'whyNotOwnApp', 'howToConnect', 'whichProtocol', 'howManyDevices'] },
  { key: 'usage', questions: ['whichCountries', 'speed', 'torrents', 'streaming'] },
  { key: 'trouble', questions: ['notConnecting', 'slowSpeed', 'linkLeaked', 'changePhone'] },
  { key: 'billing', questions: ['howToPay', 'refund', 'autoRenew', 'trial'] }
] as const;

export type FaqGroup = (typeof FAQ_GROUPS)[number]['key'];

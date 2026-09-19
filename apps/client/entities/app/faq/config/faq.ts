export const FAQ_GROUPS = [
  { key: 'start', questions: ['whatIsIncy', 'whyNotOwnApp', 'otherApps', 'howToConnect', 'whichProtocol', 'howManyDevices'] },
  { key: 'usage', questions: ['whichCountries', 'speed', 'torrents', 'streaming'] },
  { key: 'trouble', questions: ['notConnecting', 'slowSpeed', 'linkLeaked', 'changePhone'] },
  { key: 'billing', questions: ['howToPay', 'refund', 'autoRenew', 'trial'] }
] as const;

export const FAQ_HIGHLIGHTS = ['whatIsIncy', 'whyNotOwnApp', 'howManyDevices', 'refund'] as const;

export const FAQ_QUESTIONS = FAQ_GROUPS.flatMap((group) => group.questions);

export type FaqGroup = (typeof FAQ_GROUPS)[number]['key'];

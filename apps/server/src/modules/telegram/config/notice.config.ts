import type { NoticeSpec } from '../telegram.types';

export const MESSAGE_EFFECT = {
  celebrate: '5046509860389126442',
  thumbsUp: '5107584321108051014'
} as const;

export const NOTICES = {
  paid: { markup: 'main', effect: MESSAGE_EFFECT.celebrate },
  expired: { markup: 'main' },
  renewed: { markup: ['autoRenew'], effect: MESSAGE_EFFECT.thumbsUp },
  renewSoon: { markup: ['autoRenew'] },
  chargeFailed: { markup: ['renew'] },
  endingSoon: { markup: ['renew'] },
  trialEndingSoon: { markup: ['renew'] },
  devicesAdded: { markup: ['devices'], effect: MESSAGE_EFFECT.thumbsUp },
  deviceAdded: { markup: ['devices'] },
  deviceBlocked: { markup: ['devices'] },
  devicesShrunk: { markup: ['devices'] },
  legacyRetired: { markup: ['devices'] }
} as const satisfies Record<string, NoticeSpec>;

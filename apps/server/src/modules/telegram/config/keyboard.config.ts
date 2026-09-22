import type { KeyboardRow } from '../telegram.types';

export const KEYBOARD_ROWS: KeyboardRow[] = [
  [
    { key: 'connect', when: 'subscribed' },
    { key: 'apps', when: 'subscribed' }
  ],
  [
    { key: 'status', when: 'subscribed' },
    { key: 'renew', when: 'subscribed' }
  ],
  [{ key: 'trial', when: 'trialAvailable' }],
  [{ key: 'buy', when: 'unsubscribed' }],
  [
    { key: 'devices', when: 'subscribed' },
    { key: 'autoRenew', when: 'subscribed' },
    { key: 'rotate', when: 'subscribed' }
  ],
  [
    { key: 'help', when: 'always' },
    { key: 'language', when: 'always' }
  ],
  [
    { key: 'unlink', when: 'always' },
    { key: 'deleteAccount', when: 'always' }
  ]
];

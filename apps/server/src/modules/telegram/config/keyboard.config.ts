import type { KeyboardRow } from '../telegram.types';

export const KEYBOARD_ROWS: KeyboardRow[] = [
  [
    { key: 'connect', when: 'subscribed' },
    { key: 'status', when: 'subscribed' }
  ],
  [{ key: 'trial', when: 'trialAvailable' }],
  [{ key: 'buy', when: 'always' }],
  [
    { key: 'help', when: 'always' },
    { key: 'language', when: 'always' }
  ]
];

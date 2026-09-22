import { Keyboard } from 'grammy';
import { isEmpty } from 'remeda';
import { match } from 'ts-pattern';

import type { ChatState, KeyboardInput, VisibilityInput } from '../../telegram.types';

import { BOT_BUTTONS, KEYBOARD_ROWS } from '../../config';

const isVisible = ({ when, state }: VisibilityInput): boolean =>
  match(when)
    .with('always', () => true)
    .with('subscribed', () => state.isSubscribed)
    .with('unsubscribed', () => !state.isSubscribed)
    .with('trialAvailable', () => state.isTrialAvailable)
    .exhaustive();

const visibleRows = (state: ChatState) =>
  KEYBOARD_ROWS.map((row) => row.filter(({ when }) => isVisible({ when, state }))).filter((row) => !isEmpty(row));

export const mainKeyboard = ({ locale, state }: KeyboardInput): Keyboard => {
  const labels = BOT_BUTTONS[locale];
  const rows = visibleRows(state).map((row) => row.map(({ key }) => Keyboard.text(labels[key])));

  return Keyboard.from(rows).resized();
};

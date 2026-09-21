import { Keyboard } from 'grammy';

import type { ButtonVisibility, ChatState, KeyboardInput, KeyboardRow } from '../../telegram.types';

import { BOT_BUTTONS, KEYBOARD_ROWS } from '../../config';

const isVisible = ({ when, state }: { when: ButtonVisibility; state: ChatState }): boolean => {
  if (when === 'always') {
    return true;
  }

  if (when === 'subscribed') {
    return state.isSubscribed;
  }

  if (when === 'unsubscribed') {
    return !state.isSubscribed;
  }

  return state.isTrialAvailable;
};

const visibleRows = (state: ChatState): KeyboardRow[] =>
  KEYBOARD_ROWS.map((row) => row.filter(({ when }) => isVisible({ when, state }))).filter((row) => row.length > 0);

export const mainKeyboard = ({ locale, state }: KeyboardInput): Keyboard => {
  const keyboard = new Keyboard().resized().persistent();
  const labels = BOT_BUTTONS[locale];
  const rows = visibleRows(state);

  for (const [index, row] of rows.entries()) {
    for (const { key } of row) {
      keyboard.text(labels[key]);
    }

    if (index < rows.length - 1) {
      keyboard.row();
    }
  }

  return keyboard;
};

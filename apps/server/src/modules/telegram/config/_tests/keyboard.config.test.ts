import { describe, expect, it } from 'vitest';

import { BOT_BUTTONS, BOT_LOCALES, KEYBOARD_ROWS } from '../index';

const keyboardKeys = KEYBOARD_ROWS.flat().map((slot) => slot.key);

describe('KEYBOARD_ROWS', () => {
  it('names a button that both locales can label, so no press renders blank', () => {
    for (const locale of BOT_LOCALES) {
      for (const key of keyboardKeys) {
        expect(BOT_BUTTONS[locale][key]).toBeTruthy();
      }
    }
  });

  it('places every button once, because a repeated one is an ambiguous press', () => {
    expect(new Set(keyboardKeys).size).toBe(keyboardKeys.length);
  });

  it('labels every button differently across both languages, so a label maps back to one key', () => {
    const labels = BOT_LOCALES.flatMap((locale) => keyboardKeys.map((key) => BOT_BUTTONS[locale][key]));

    expect(new Set(labels).size).toBe(labels.length);
  });
});

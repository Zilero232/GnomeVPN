import { describe, expect, it } from 'vitest';

import { isFormatted, repairFor, withDefaults } from '../send-defaults.helpers';

const sent = { chat_id: 1, text: '<b>Paid</b> &amp; done', parse_mode: 'HTML', message_effect_id: '1', reply_markup: { a: 1 } };

describe('withDefaults', () => {
  it('formats as HTML and hides link previews unless the caller says otherwise', () => {
    expect(withDefaults({ text: 'x' })).toEqual({ text: 'x', parse_mode: 'HTML', link_preview_options: { is_disabled: true } });
  });

  it('lets a caller override either default', () => {
    expect(withDefaults({ text: 'x', link_preview_options: { is_disabled: false } }).link_preview_options).toEqual({ is_disabled: false });
  });
});

describe('repairFor', () => {
  it('sends a message Telegram could not parse again as plain text, keeping the effect and the buttons', () => {
    const repair = repairFor({ error_code: 400, description: "Bad Request: can't parse entities: Unclosed start tag" });

    expect(repair?.(sent)).toEqual({ chat_id: 1, text: 'Paid & done', message_effect_id: '1', reply_markup: { a: 1 } });
  });

  it('drops only an effect Telegram does not know, so the formatting survives', () => {
    const repair = repairFor({ error_code: 400, description: 'Bad Request: EFFECT_ID_INVALID' });

    expect(repair?.(sent)).toEqual({ chat_id: 1, text: sent.text, parse_mode: 'HTML', reply_markup: { a: 1 } });
  });

  it('leaves every other failure to the caller', () => {
    expect(repairFor({ error_code: 403, description: 'Forbidden: bot was blocked by the user' })).toBeNull();
    expect(repairFor({ error_code: 400, description: 'Bad Request: chat not found' })).toBeNull();
  });
});

describe('isFormatted', () => {
  it('covers sending and editing text, nothing else', () => {
    expect(isFormatted('sendMessage')).toBe(true);
    expect(isFormatted('editMessageText')).toBe(true);
    expect(isFormatted('answerCallbackQuery')).toBe(false);
  });
});

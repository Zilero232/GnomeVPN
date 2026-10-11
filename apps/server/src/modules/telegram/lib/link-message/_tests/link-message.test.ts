import { describe, expect, it } from 'vitest';

import { BOT_LOCALES, BOT_TEXT } from '../../../config';
import { html, isTelegramHtml } from '../../html';
import { linkMessage } from '../link-message';

const url = 'https://vpn.example.com/sub/abc?x=1&y=2';

describe('linkMessage', () => {
  it('shows the link escaped, so a query string cannot break the markup', () => {
    for (const locale of BOT_LOCALES) {
      const { text } = linkMessage({ locale, intro: BOT_TEXT[locale].linkIntro, url });

      expect(isTelegramHtml(text)).toBe(true);
      expect(html.strip(text)).toContain(url);
    }
  });

  it('offers a button that copies exactly the link', () => {
    const { markup } = linkMessage({ locale: 'en', intro: 'x', url });
    const copied = markup?.inline_keyboard.flat().flatMap((button) => ('copy_text' in button ? [button.copy_text.text] : []));

    expect(copied).toEqual([url]);
  });
});

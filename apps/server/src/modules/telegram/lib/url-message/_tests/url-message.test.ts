import { describe, expect, it } from 'vitest';

import { html } from '../../html';
import { urlMessage } from '../url-message';

const base = { intro: 'Pay here', label: 'Pay', style: 'success' as const };

describe('urlMessage', () => {
  it('puts a public https link behind a button and keeps it out of the text', () => {
    const url = 'https://pay.example.com/x?a=1&b=2';
    const { text, markup } = urlMessage({ ...base, url });
    const urls = markup?.inline_keyboard.flat().flatMap((button) => ('url' in button ? [button.url] : []));

    expect(text).toBe(base.intro);
    expect(urls).toEqual([url]);
  });

  it('writes a link Telegram would refuse as a button into the text instead, escaped', () => {
    const url = 'http://localhost:3000/x?a=1&b=2';
    const { text, markup } = urlMessage({ ...base, url });

    expect(markup).toBeUndefined();
    expect(html.strip(text)).toContain(url);
    expect(text).toContain('&amp;');
  });
});

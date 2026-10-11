import { describe, expect, it } from 'vitest';

import { html, isTelegramHtml } from '../html';

describe('html.escape', () => {
  it('escapes the characters Telegram reads as markup, so a device name cannot break a message', () => {
    expect(html.escape('Tom & Jerry <TV> "4K"')).toBe('Tom &amp; Jerry &lt;TV&gt; &quot;4K&quot;');
  });

  it('leaves ordinary text alone', () => {
    expect(html.escape('Pixel 8 — Android 15')).toBe('Pixel 8 — Android 15');
  });
});

describe('html.strip', () => {
  it('turns markup back into the text a reader would have seen', () => {
    expect(html.strip('<b>Paid</b> &amp; <a href="https://x.y">done</a> &lt;3')).toBe('Paid & done <3');
  });

  it('undoes html.escape exactly', () => {
    const raw = 'a & b < c > d "e"';

    expect(html.strip(html.escape(raw))).toBe(raw);
  });
});

describe('isTelegramHtml', () => {
  it('accepts the tags Telegram supports, nested and with attributes', () => {
    expect(isTelegramHtml('<b>Hi</b> <blockquote expandable><i>x</i> <a href="https://a.b">y</a></blockquote>')).toBe(true);
  });

  it('refuses a tag Telegram does not know', () => {
    expect(isTelegramHtml('<div>x</div>')).toBe(false);
  });

  it('refuses unbalanced or crossed tags', () => {
    expect(isTelegramHtml('<b>x')).toBe(false);
    expect(isTelegramHtml('<b><i>x</b></i>')).toBe(false);
  });

  it('refuses a bare angle bracket, which Telegram rejects as a broken tag', () => {
    expect(isTelegramHtml('5 < 6')).toBe(false);
  });
});

describe('html.bold and html.code', () => {
  it('escape what they wrap', () => {
    expect(html.bold('<x>')).toBe('<b>&lt;x&gt;</b>');
    expect(html.code('a&b')).toBe('<code>a&amp;b</code>');
  });
});

describe('html.paragraphs', () => {
  it('puts a blank line between the parts and skips the missing ones', () => {
    expect(html.paragraphs(['a', null, '', 'b', undefined])).toBe('a\n\nb');
  });
});

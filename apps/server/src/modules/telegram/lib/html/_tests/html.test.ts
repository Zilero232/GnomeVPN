import { describe, expect, it } from 'vitest';

import { code, escapeHtml } from '../html';

describe('escapeHtml', () => {
  it('escapes what would otherwise open a tag', () => {
    expect(escapeHtml('<b>hi</b>')).toBe('&lt;b&gt;hi&lt;/b&gt;');
  });

  it('escapes the ampersand first, so an escape is never double-read', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('leaves an ordinary subscription URL intact', () => {
    const url = 'https://example.com/sub/abc123';

    expect(escapeHtml(url)).toBe(url);
  });
});

describe('code', () => {
  it('wraps a value so Telegram renders it as one tappable block', () => {
    expect(code('abc')).toBe('<code>abc</code>');
  });

  it('escapes the value it wraps, so a crafted link cannot inject markup', () => {
    expect(code('</code><b>x')).toBe('<code>&lt;/code&gt;&lt;b&gt;x</code>');
  });
});

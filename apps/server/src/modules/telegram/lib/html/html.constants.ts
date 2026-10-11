export const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
} as const;

export const TELEGRAM_TAGS = ['b', 'i', 'u', 's', 'code', 'pre', 'a', 'blockquote', 'tg-spoiler'] as const;

export const TAG_PATTERN = /<\/?([a-z-]+)(?:\s[^>]*)?>/g;

export const PARAGRAPH_BREAK = '\n\n';

export const ENTITY_PATTERN = /&(amp|lt|gt|quot);/g;

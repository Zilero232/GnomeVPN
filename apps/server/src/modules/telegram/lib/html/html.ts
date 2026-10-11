import { invert, isTruthy } from 'remeda';

import type { TelegramTag } from './html.types';

import { ENTITY_PATTERN, HTML_ESCAPES, PARAGRAPH_BREAK, TAG_PATTERN, TELEGRAM_TAGS } from './html.constants';

const ESCAPES: Record<string, string> = HTML_ESCAPES;

const UNESCAPES: Record<string, string> = invert(HTML_ESCAPES);

const KNOWN_TAGS: readonly string[] = TELEGRAM_TAGS;

const isTelegramTag = (name: string): name is TelegramTag => KNOWN_TAGS.includes(name);

const escape = (value: string): string => value.replaceAll(/[&<>"]/g, (char) => ESCAPES[char] ?? char);

export const html = {
  escape,
  strip: (markup: string): string => markup.replaceAll(TAG_PATTERN, '').replaceAll(ENTITY_PATTERN, (entity) => UNESCAPES[entity] ?? entity),
  bold: (value: string): string => `<b>${escape(value)}</b>`,
  code: (value: string): string => `<code>${escape(value)}</code>`,
  italic: (markup: string): string => `<i>${markup}</i>`,
  quote: (markup: string): string => `<blockquote>${markup}</blockquote>`,
  paragraphs: (parts: (string | null | undefined)[]): string => parts.filter(isTruthy).join(PARAGRAPH_BREAK)
} as const;

export const isTelegramHtml = (markup: string): boolean => {
  const open: string[] = [];

  for (const [tag, name] of markup.matchAll(TAG_PATTERN)) {
    if (!isTelegramTag(name)) {
      return false;
    }

    if (!tag.startsWith('</')) {
      open.push(name);

      continue;
    }

    if (open.pop() !== name) {
      return false;
    }
  }

  return open.length === 0 && !/[<>]/.test(markup.replaceAll(TAG_PATTERN, ''));
};

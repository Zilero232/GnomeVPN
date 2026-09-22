const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

export const escapeHtml = (value: string): string => value.replaceAll(/[&<>]/gu, (char) => ESCAPES[char] ?? char);

export const code = (value: string): string => `<code>${escapeHtml(value)}</code>`;

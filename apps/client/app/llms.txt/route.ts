import { SITE } from '@/shared/config';
import { DEFAULT_LOCALE, localePath, messages } from '@/shared/i18n';

import { LLMS_CONTENT_TYPE, LLMS_PAGES } from './llms.constants';

const absolute = (path: string) => new URL(localePath({ path, locale: DEFAULT_LOCALE }), SITE.url).toString();

export const GET = () => {
  const copy = messages[DEFAULT_LOCALE];

  const pages = LLMS_PAGES.map(({ path, namespace }) => {
    const { title, description } = copy[namespace].meta;

    return `- [${title}](${absolute(path)}): ${description}`;
  });

  const lines = [`# ${SITE.name}`, '', `> ${SITE.description}`, '', '## Страницы', '', ...pages, '', '## Контакты', '', `- Поддержка: ${SITE.email}`];

  return new Response(`${lines.join('\n')}\n`, { headers: { 'Content-Type': LLMS_CONTENT_TYPE } });
};

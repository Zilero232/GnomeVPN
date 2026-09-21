import { CLIENT_IDS, CLIENT_REGISTRY } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import { BOT_LOCALES, BOT_TEXT } from '../../../config';
import { clientName, parseClientId } from '../client-name';

describe('clientName', () => {
  it('names every client the registry publishes', () => {
    for (const id of CLIENT_IDS) {
      expect(clientName({ id, locale: 'ru' }).trim()).not.toBe('');
    }
  });

  it('marks the recommended client, and only that one', () => {
    for (const locale of BOT_LOCALES) {
      const marked = CLIENT_IDS.filter((id) => clientName({ id, locale }).includes(BOT_TEXT[locale].appsRecommended));
      const recommended = CLIENT_IDS.filter((id) => CLIENT_REGISTRY[id].isRecommended);

      expect(marked).toEqual(recommended);
    }
  });

  it('keeps the brand name identical across languages', () => {
    for (const id of CLIENT_IDS) {
      const [ru, en] = BOT_LOCALES.map((locale) => clientName({ id, locale }));

      expect(ru.startsWith(CLIENT_REGISTRY[id].isRecommended ? ru.split(' ')[0] : ru)).toBe(true);
      expect(en.split(' ')[0]).toBe(ru.split(' ')[0]);
    }
  });
});

describe('parseClientId', () => {
  it('accepts every id the registry holds', () => {
    for (const id of CLIENT_IDS) {
      expect(parseClientId(id)).toBe(id);
    }
  });

  it('refuses anything else, so a crafted payload cannot index the registry', () => {
    expect(parseClientId('made-up')).toBeNull();
    expect(parseClientId('')).toBeNull();
    expect(parseClientId('__proto__')).toBeNull();
    expect(parseClientId('constructor')).toBeNull();
  });
});

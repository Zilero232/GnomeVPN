import type { PluralizeInput } from './pluralize.types';

import { DEFAULT_PLURAL_LOCALE } from './pluralize.constants';

const rulesByLocale = new Map<string, Intl.PluralRules>();

const rulesFor = (locale: string): Intl.PluralRules => {
  const cached = rulesByLocale.get(locale);

  if (cached) {
    return cached;
  }

  const rules = new Intl.PluralRules(locale);

  rulesByLocale.set(locale, rules);

  return rules;
};

export const pluralize = ({ count, forms, locale = DEFAULT_PLURAL_LOCALE }: PluralizeInput): string =>
  forms[rulesFor(locale).select(count)] ?? forms.many;

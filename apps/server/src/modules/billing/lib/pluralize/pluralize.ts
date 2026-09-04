import type { PluralizeInput } from './pluralize.types';

const rules = new Intl.PluralRules('ru-RU');

export const pluralize = ({ count, forms }: PluralizeInput): string => forms[rules.select(count)] ?? forms.many;

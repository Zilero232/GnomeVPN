import { format } from 'date-fns';
import { isNullish } from 'remeda';

import type { FormatDateInput } from './format-date.types';

import { DATE_FORMAT, DATE_LOCALES } from './format-date.constants';

export const formatDate = ({ iso, locale }: FormatDateInput) => {
  if (isNullish(iso)) {
    return '';
  }

  return format(new Date(iso), DATE_FORMAT, { locale: DATE_LOCALES[locale] });
};

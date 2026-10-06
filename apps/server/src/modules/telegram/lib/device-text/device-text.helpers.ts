import { isEmpty, isNonNullish } from 'remeda';

export const present = (values: (string | null)[]): string[] => values.filter(isNonNullish).filter((value) => !isEmpty(value.trim()));

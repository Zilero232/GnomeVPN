import { entries } from 'remeda';

import type { FillTextInput } from './fill-text.types';

import { TEXT_TOKEN } from '../../config';

export const fillText = ({ text, fill }: FillTextInput): string =>
  entries(fill).reduce((carry, [token, value]) => carry.replaceAll(TEXT_TOKEN[token], value), text);

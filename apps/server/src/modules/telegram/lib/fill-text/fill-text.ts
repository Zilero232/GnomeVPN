import { entries } from 'remeda';

import type { FillTextInput } from './fill-text.types';

import { TEXT_TOKEN } from '../../config';
import { html } from '../html';

export const fillLabel = ({ text, fill }: FillTextInput): string =>
  entries(fill).reduce((carry, [token, value]) => carry.replaceAll(TEXT_TOKEN[token], value), text);

export const fillText = ({ text, fill }: FillTextInput): string =>
  entries(fill).reduce((carry, [token, value]) => carry.replaceAll(TEXT_TOKEN[token], html.escape(value)), text);

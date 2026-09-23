import type { TEXT_TOKEN } from '../../config';

export type TextFill = Partial<Record<keyof typeof TEXT_TOKEN, string>>;

export type FillTextInput = {
  text: string;
  fill: TextFill;
};

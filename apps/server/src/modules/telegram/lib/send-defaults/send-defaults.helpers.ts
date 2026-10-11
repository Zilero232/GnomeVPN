import { isString, omit } from 'remeda';

import type { ApiFailure, ApiPayload, Repair } from './send-defaults.types';

import { html } from '../html';
import { SEND_DEFAULTS } from './send-defaults.constants';

const FORMATTED_METHODS: readonly string[] = SEND_DEFAULTS.formattedMethods;

const dropEffect: Repair = (payload) => omit(payload, ['message_effect_id']);

const asPlain: Repair = (payload) => {
  const rest = omit(payload, ['parse_mode']);

  return isString(rest.text) ? { ...rest, text: html.strip(rest.text) } : rest;
};

const REPAIRS = [
  { pattern: SEND_DEFAULTS.unknownEffect, repair: dropEffect },
  { pattern: SEND_DEFAULTS.brokenMarkup, repair: asPlain }
] as const;

export const isFormatted = (method: string): boolean => FORMATTED_METHODS.includes(method);

export const withDefaults = (payload: ApiPayload): ApiPayload => ({
  parse_mode: 'HTML',
  link_preview_options: { is_disabled: true },
  ...payload
});

export const repairFor = ({ error_code, description }: ApiFailure): Repair | null => {
  if (error_code !== SEND_DEFAULTS.badRequest) {
    return null;
  }

  return REPAIRS.find(({ pattern }) => pattern.test(description))?.repair ?? null;
};

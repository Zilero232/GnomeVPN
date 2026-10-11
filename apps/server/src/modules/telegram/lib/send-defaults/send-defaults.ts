import type { Transformer } from 'grammy';

import { isFormatted, repairFor, withDefaults } from './send-defaults.helpers';

export const sendDefaults: Transformer = async (prev, method, payload, signal) => {
  if (!isFormatted(method)) {
    return prev(method, payload, signal);
  }

  // eslint-disable-next-line ts/consistent-type-assertions -- grammY types the payload per method; the defaults only add optional fields every formatted method accepts
  const formatted = withDefaults(payload) as typeof payload;
  const result = await prev(method, formatted, signal);
  const repair = result.ok ? null : repairFor(result);

  if (!repair) {
    return result;
  }

  // eslint-disable-next-line ts/consistent-type-assertions -- a repair only removes optional fields from the same payload
  return prev(method, repair(formatted) as typeof payload, signal);
};

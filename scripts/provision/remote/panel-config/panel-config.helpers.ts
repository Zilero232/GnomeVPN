import type { z } from 'zod';

import type { ParsePanelReplyInput } from './panel-config.types';

import { CORE_SETTING } from './panel-config.constants';
import { panelReplySchema, panelSettingsReplySchema } from './panel-config.schemas';

const readJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export const parsePanelReply = <Schema extends z.ZodType<z.infer<typeof panelReplySchema>>>({
  raw,
  schema,
  action
}: ParsePanelReplyInput<Schema>): z.infer<Schema> => {
  const result = schema.safeParse(readJson(raw));

  if (!result.success) {
    throw new Error(`the panel gave an unreadable answer when asked to ${action}`);
  }

  if (!result.data.success) {
    throw new Error(`the panel refused to ${action}: ${result.data.msg ?? 'no reason given'}`);
  }

  return result.data;
};

export const settingsKeepingCore = (raw: string): string => {
  const { obj } = parsePanelReply({ raw, schema: panelSettingsReplySchema, action: 'read its settings' });

  if (Object.keys(obj).length === 0) {
    throw new Error('the panel returned no settings, refusing to write them back');
  }

  return JSON.stringify({ ...obj, [CORE_SETTING.restartOnClientDisable]: false });
};

export const assertPanelAccepted = (raw: string) => {
  parsePanelReply({ raw, schema: panelReplySchema, action: 'save its settings' });
};

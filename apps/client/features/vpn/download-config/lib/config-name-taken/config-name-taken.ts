import type { ConfigSlot, IsConfigNameTakenInput, TakenConfigNamesInput } from './config-name-taken.types';

const isSameSlot = ({ config, slot }: { config: ConfigSlot; slot: Omit<ConfigSlot, 'name'> }) =>
  config.nodeId === slot.nodeId && config.protocol === slot.protocol;

export const takenConfigNames = ({ configs, nodeId, protocol }: TakenConfigNamesInput): string[] => {
  if (!nodeId || !protocol) {
    return [];
  }

  return configs.filter((config) => isSameSlot({ config, slot: { nodeId, protocol } })).map((config) => config.name);
};

export const isConfigNameTaken = ({ configs, slot }: IsConfigNameTakenInput): boolean =>
  configs.some((config) => config.name === slot.name && isSameSlot({ config, slot }));

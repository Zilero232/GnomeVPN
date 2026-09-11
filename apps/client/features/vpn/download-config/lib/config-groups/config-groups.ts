import { groupByProp, prop, sortBy } from 'remeda';

import type { ConfigWithStatus } from '../config-status';
import type { ConfigCountry, VisibleConfigsInput } from './config-groups.types';

import { CONFIG_FILTER_ALL, CONFIG_FILTER_ONLINE } from '../../config';

export const configCountries = (configs: ConfigWithStatus[]): ConfigCountry[] =>
  sortBy(
    Object.entries(groupByProp(configs, 'country')).map(([name, matching]) => ({
      name,
      code: matching[0]?.countryCode ?? '',
      count: matching.length
    })),
    prop('name')
  );

export const visibleConfigs = ({ configs, filter, hasFilter }: VisibleConfigsInput): ConfigWithStatus[] => {
  if (!hasFilter || filter === CONFIG_FILTER_ALL) {
    return configs;
  }

  if (filter === CONFIG_FILTER_ONLINE) {
    return configs.filter((config) => config.isOnline);
  }

  return configs.filter((config) => config.country === filter);
};

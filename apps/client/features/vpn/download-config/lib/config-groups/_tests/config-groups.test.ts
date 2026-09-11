import { describe, expect, it } from 'vitest';

import type { ConfigWithStatus } from '../../config-status';

import { CONFIG_FILTER_ALL, CONFIG_FILTER_ONLINE } from '../../../config';
import { configCountries, visibleConfigs } from '../config-groups';

const config = (id: string, country: string, isOnline = false): ConfigWithStatus =>
  ({ id, country, countryCode: country.slice(0, 2).toLowerCase(), isOnline, isBroken: false }) as ConfigWithStatus;

describe('configCountries', () => {
  it('counts the configs in each country', () => {
    const countries = configCountries([config('a', 'Finland'), config('b', 'Finland'), config('c', 'Netherlands')]);

    expect(countries).toEqual([
      { name: 'Finland', code: 'fi', count: 2 },
      { name: 'Netherlands', code: 'ne', count: 1 }
    ]);
  });

  it('orders countries by name rather than by first appearance', () => {
    const countries = configCountries([config('a', 'Netherlands'), config('b', 'Finland')]);

    expect(countries.map((country) => country.name)).toEqual(['Finland', 'Netherlands']);
  });

  it('returns nothing for no configs', () => {
    expect(configCountries([])).toEqual([]);
  });
});

describe('visibleConfigs', () => {
  const configs = [config('a', 'Finland', true), config('b', 'Finland'), config('c', 'Netherlands', true)];

  it('shows everything while the filter is not offered', () => {
    expect(visibleConfigs({ configs, filter: CONFIG_FILTER_ONLINE, hasFilter: false })).toHaveLength(3);
  });

  it('shows everything under the all filter', () => {
    expect(visibleConfigs({ configs, filter: CONFIG_FILTER_ALL, hasFilter: true })).toHaveLength(3);
  });

  it('keeps only the online ones under the online filter', () => {
    const visible = visibleConfigs({ configs, filter: CONFIG_FILTER_ONLINE, hasFilter: true });

    expect(visible.map((entry) => entry.id)).toEqual(['a', 'c']);
  });

  it('keeps only the matching country under a country filter', () => {
    const visible = visibleConfigs({ configs, filter: 'Finland', hasFilter: true });

    expect(visible.map((entry) => entry.id)).toEqual(['a', 'b']);
  });

  it('returns nothing for a country that has no configs', () => {
    expect(visibleConfigs({ configs, filter: 'Germany', hasFilter: true })).toEqual([]);
  });
});

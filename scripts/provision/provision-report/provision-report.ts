import { isNonNullish } from 'remeda';

import type { ProvisionResult } from '../provision-host';

import { COUNTRY_WIDTH, HOST_WIDTH } from './provision-report.constants';

export const formatSummary = (results: ProvisionResult[]): string =>
  results
    .map((result) => {
      const suffix = isNonNullish(result.error) ? ` (${result.error})` : '';

      return `  ${result.country.padEnd(COUNTRY_WIDTH)} ${result.host.padEnd(HOST_WIDTH)} ${result.status}${suffix}`;
    })
    .join('\n');

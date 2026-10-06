import { isNonNullish } from 'remeda';

import type { ProvisionResult } from '../provision-host';

import { SUMMARY_COLUMNS } from './provision-report.constants';

export const formatSummary = (results: ProvisionResult[]) =>
  results
    .map((result) => {
      const suffix = isNonNullish(result.error) ? ` (${result.error})` : '';

      return `  ${result.country.padEnd(SUMMARY_COLUMNS.country)} ${result.host.padEnd(SUMMARY_COLUMNS.host)} ${result.status}${suffix}`;
    })
    .join('\n');

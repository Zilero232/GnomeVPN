import type { CountryFlagProps } from './CountryFlag.types';

import { countryFlag } from './CountryFlag.variants';

import 'flag-icons/css/flag-icons.min.css';

export const CountryFlag = ({ countryCode, size = 'md', className }: CountryFlagProps) => (
  <span
    aria-hidden
    className={countryFlag({
      size,
      class: `fi fi-${countryCode.toLowerCase()} ${className ?? ''}`.trim()
    })}
  />
);

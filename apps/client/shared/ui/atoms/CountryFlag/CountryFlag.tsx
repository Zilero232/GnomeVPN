import { countryFlag } from './CountryFlag.variants';

import type { CountryFlagProps } from './CountryFlag.types';

export const CountryFlag = ({ countryCode, size = 'md', className }: CountryFlagProps) => (
  <span
    aria-hidden
    className={countryFlag({
      size,
      class: `fi fi-${countryCode.toLowerCase()} ${className ?? ''}`.trim(),
    })}
  />
);

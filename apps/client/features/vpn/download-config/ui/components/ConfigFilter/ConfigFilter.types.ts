export type ConfigFilterCountry = {
  name: string;
  code: string;
  count: number;
};

export type ConfigFilterProps = {
  className?: string;
  value: string;
  countries: ConfigFilterCountry[];
  total: number;
  onlineCount: number;
  isDisabled?: boolean;
  onChange: (value: string) => void;
};

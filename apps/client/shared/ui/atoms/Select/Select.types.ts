export type SelectOption = {
  value: string;
  label: string;
  isDisabled?: boolean;
};

export type SelectProps = {
  value: string;
  options: SelectOption[];
  id?: string;
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
  'aria-label'?: string;
  onChange: (value: string) => void;
};

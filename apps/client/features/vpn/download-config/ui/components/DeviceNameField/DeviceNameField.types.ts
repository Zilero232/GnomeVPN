export type DeviceNameFieldProps = {
  value: string;
  takenNames: string[];
  isDisabled?: boolean;
  onChange: (value: string) => void;
};

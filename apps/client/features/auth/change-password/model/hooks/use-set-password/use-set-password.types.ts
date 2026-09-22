export type UseSetPasswordInput = {
  onSent: () => void;
};

export type SetPasswordState = {
  hasEmail: boolean;
  isPending: boolean;
  send: () => void;
};

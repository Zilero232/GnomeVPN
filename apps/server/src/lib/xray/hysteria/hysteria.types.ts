export type HysteriaClient = {
  email: string;
  auth: string;
  enable?: boolean;
  limitIp?: number;
  totalGB?: number;
  expiryTime?: number;
  tgId?: number;
  reset?: number;
};

export type CreateClientInput = {
  email: string;
  auth: string;
};

export type CreateClientResult = {
  nodeCredential: string;
  email: string;
};

export type SetClientEnabledInput = {
  email: string;
  enabled: boolean;
};

export type SetClientsEnabledInput = {
  emails: string[];
  enabled: boolean;
};

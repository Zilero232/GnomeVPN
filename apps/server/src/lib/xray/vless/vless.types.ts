export type VlessClient = {
  email: string;
  id: string;
  flow?: string;
  enable?: boolean;
  limitIp?: number;
  totalGB?: number;
  expiryTime?: number;
  tgId?: number;
  reset?: number;
};

export type CreateVlessClientInput = {
  email: string;
  id: string;
  deferRestart?: boolean;
};

export type CreateVlessClientResult = {
  nodeCredential: string;
  email: string;
};

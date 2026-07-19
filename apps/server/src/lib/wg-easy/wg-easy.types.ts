export type CreateClientResult = {
  clientId: string;
  privateKey: string;
  address: string;
  serverPublicKey: string;
  presharedKey: string | null;
  dns: string;
};

export type WgEasyClientRow = {
  id: string;
  name: string;
  address: string;
  latestHandshakeAt?: string | null;
};

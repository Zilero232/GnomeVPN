export type CreateClientResult = {
  clientId: string;
  privateKey: string;
  address: string;
  serverPublicKey: string;
  dns: string;
};

export type WgEasyClientRow = {
  id: string;
  name: string;
  address: string;
  latestHandshakeAt?: string | null;
};

export type ConnectSessionInput = {
  userId: string;
  nodeId: string;
  deviceId: string;
};

export type DisconnectSessionInput = {
  userId: string;
  deviceId: string;
};

export type HeartbeatSessionInput = {
  userId: string;
  deviceId: string;
};

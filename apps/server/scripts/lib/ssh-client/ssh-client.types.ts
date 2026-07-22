export type SshConnectOptions = {
  host: string;
  username: string;
  password?: string;
  privateKeyPath?: string;
};

export type SshExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

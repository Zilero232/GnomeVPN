export type ShellArg = number | string;

export type DockerExecInput = {
  container: string;
  argv: ShellArg[];
};

export type DockerShellInput = {
  container: string;
  script: string;
};

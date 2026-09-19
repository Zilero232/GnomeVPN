export type SetupStep = {
  key: string;
  title: string;
  body: string;
};

export type SetupStepsProps = {
  steps: SetupStep[];
};

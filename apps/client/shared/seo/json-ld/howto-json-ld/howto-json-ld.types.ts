export type HowToStep = {
  name: string;
  text: string;
};

export type HowToJsonLdInput = {
  name: string;
  description: string;
  steps: HowToStep[];
};

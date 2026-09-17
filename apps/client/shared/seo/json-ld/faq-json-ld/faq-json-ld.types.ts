export type FaqEntry = {
  question: string;
  answer: string;
};

export type FaqJsonLdInput = {
  entries: FaqEntry[];
};

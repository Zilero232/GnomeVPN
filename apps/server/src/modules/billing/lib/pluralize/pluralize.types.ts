export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { many: string };

export type PluralizeInput = {
  count: number;
  forms: PluralForms;
};

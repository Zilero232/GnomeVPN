import type { Plan } from '@gnomevpn/schemas';

const pluralizeMonths = (months: number): string => {
  const lastTwo = months % 100;
  const last = months % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return 'месяцев';
  }

  if (last === 1) {
    return 'месяц';
  }

  return last >= 2 && last <= 4 ? 'месяца' : 'месяцев';
};

export const describePlan = (plan: Plan): string =>
  `Подписка GnomeVPN на ${plan.months} ${pluralizeMonths(plan.months)}`;

export const describeRenewal = (plan: Plan): string =>
  `Продление подписки GnomeVPN на ${plan.months} ${pluralizeMonths(plan.months)}`;

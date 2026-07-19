export const LANDING_NAV_SECTIONS = ['how', 'pricing', 'faq'] as const;

export type LandingNavSection = (typeof LANDING_NAV_SECTIONS)[number];

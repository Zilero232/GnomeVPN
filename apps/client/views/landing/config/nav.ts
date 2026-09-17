export const LANDING_NAV_SECTIONS = ['how', 'features', 'faq'] as const;

export type LandingNavSection = (typeof LANDING_NAV_SECTIONS)[number];

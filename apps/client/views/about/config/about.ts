export const ABOUT_SECTIONS = ['problem', 'protocol', 'noLogs', 'infrastructure', 'client', 'honesty'] as const;

export const ABOUT_FACTS = ['protocol', 'transport', 'clientApp', 'logs'] as const;

export type AboutSection = (typeof ABOUT_SECTIONS)[number];

import type { Locale } from './locale';

import enAbout from './locales/en/about.json';
import enAccount from './locales/en/account.json';
import enAuth from './locales/en/auth.json';
import enBlog from './locales/en/blog.json';
import enCommon from './locales/en/common.json';
import enError from './locales/en/error.json';
import enErrors from './locales/en/errors.json';
import enFaq from './locales/en/faq.json';
import enFooter from './locales/en/footer.json';
import enIncy from './locales/en/incy.json';
import enLanding from './locales/en/landing.json';
import enNav from './locales/en/nav.json';
import enNotFound from './locales/en/notFound.json';
import enPlans from './locales/en/plans.json';
import enPricing from './locales/en/pricing.json';
import enPrivacy from './locales/en/privacy.json';
import enServers from './locales/en/servers.json';
import enSetup from './locales/en/setup.json';
import enTelegram from './locales/en/telegram.json';
import enTray from './locales/en/tray.json';
import enTrial from './locales/en/trial.json';
import enValidation from './locales/en/validation.json';
import ruAbout from './locales/ru/about.json';
import ruAccount from './locales/ru/account.json';
import ruAuth from './locales/ru/auth.json';
import ruBlog from './locales/ru/blog.json';
import ruCommon from './locales/ru/common.json';
import ruError from './locales/ru/error.json';
import ruErrors from './locales/ru/errors.json';
import ruFaq from './locales/ru/faq.json';
import ruFooter from './locales/ru/footer.json';
import ruIncy from './locales/ru/incy.json';
import ruLanding from './locales/ru/landing.json';
import ruNav from './locales/ru/nav.json';
import ruNotFound from './locales/ru/notFound.json';
import ruPlans from './locales/ru/plans.json';
import ruPricing from './locales/ru/pricing.json';
import ruPrivacy from './locales/ru/privacy.json';
import ruServers from './locales/ru/servers.json';
import ruSetup from './locales/ru/setup.json';
import ruTelegram from './locales/ru/telegram.json';
import ruTray from './locales/ru/tray.json';
import ruTrial from './locales/ru/trial.json';
import ruValidation from './locales/ru/validation.json';

const ru = {
  about: ruAbout,
  account: ruAccount,
  auth: ruAuth,
  blog: ruBlog,
  common: ruCommon,
  error: ruError,
  errors: ruErrors,
  faq: ruFaq,
  footer: ruFooter,
  incy: ruIncy,
  landing: ruLanding,
  nav: ruNav,
  notFound: ruNotFound,
  plans: ruPlans,
  pricing: ruPricing,
  privacy: ruPrivacy,
  servers: ruServers,
  setup: ruSetup,
  telegram: ruTelegram,
  tray: ruTray,
  trial: ruTrial,
  validation: ruValidation
};

const en = {
  about: enAbout,
  account: enAccount,
  auth: enAuth,
  blog: enBlog,
  common: enCommon,
  error: enError,
  errors: enErrors,
  faq: enFaq,
  footer: enFooter,
  incy: enIncy,
  landing: enLanding,
  nav: enNav,
  notFound: enNotFound,
  plans: enPlans,
  pricing: enPricing,
  privacy: enPrivacy,
  servers: enServers,
  setup: enSetup,
  telegram: enTelegram,
  tray: enTray,
  trial: enTrial,
  validation: enValidation
};

export type Messages = typeof ru;

export const messages: Record<Locale, Messages> = { ru, en };

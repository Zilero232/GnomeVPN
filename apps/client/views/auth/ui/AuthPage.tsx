'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { match } from 'ts-pattern';

import { LocaleSwitcher } from '@/features/app/switch-locale';
import { ForgotPasswordForm } from '@/features/auth/forgot-password';
import { SignInForm } from '@/features/auth/sign-in';
import { SignUpForm } from '@/features/auth/sign-up';
import { BrandMark, Text } from '@/shared/ui';

import s from './AuthPage.module.scss';

import type { AuthMode } from './AuthPage.types';

export const AuthPage = () => {
  const t = useTranslations('auth');

  const [mode, setMode] = useState<AuthMode>('signin');

  const isSignUp = mode === 'signup';

  const title = match(mode)
    .with('signup', () => t('signUp'))
    .with('signin', () => t('signIn'))
    .with('forgot', () => t('forgotPassword'))
    .exhaustive();

  return (
    <main className={s.root}>
      <div className={s.panel}>
        <div className={s.head}>
          <BrandMark />
          <LocaleSwitcher />
        </div>

        <h1 className={s.title}>{title}</h1>

        <div key={mode}>
          {match(mode)
            .with('signup', () => <SignUpForm />)
            .with('signin', () => <SignInForm onForgotPassword={() => setMode('forgot')} />)
            .with('forgot', () => <ForgotPasswordForm onBack={() => setMode('signin')} />)
            .exhaustive()}
        </div>

        {mode !== 'forgot' && (
          <Text align="center" size="sm" tone="muted">
            {isSignUp ? t('hasAccount') : t('noAccount')}{' '}
            <button
              className={s.toggleButton}
              type="button"
              onClick={() => setMode(isSignUp ? 'signin' : 'signup')}
            >
              {isSignUp ? t('toggleSignIn') : t('toggleSignUp')}
            </button>
          </Text>
        )}
      </div>
    </main>
  );
};

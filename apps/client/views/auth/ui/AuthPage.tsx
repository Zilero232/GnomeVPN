'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { match } from 'ts-pattern';

import { ForgotPasswordForm } from '@/features/auth/forgot-password';
import { SignInForm } from '@/features/auth/sign-in';
import { SignUpForm } from '@/features/auth/sign-up';
import { TelegramLoginButton } from '@/features/auth/telegram-sign-in';
import { Text } from '@/ui-kit';

import type { AuthMode } from './AuthPage.types';

import s from './AuthPage.module.scss';

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
    <>
      <Text as='h1' className={s.title}>
        {title}
      </Text>

      <div key={mode}>
        {match(mode)
          .with('signup', () => <SignUpForm />)
          .with('signin', () => <SignInForm onForgotPassword={() => setMode('forgot')} />)
          .with('forgot', () => <ForgotPasswordForm onBack={() => setMode('signin')} />)
          .exhaustive()}
      </div>

      {mode !== 'forgot' && <TelegramLoginButton />}

      {mode !== 'forgot' && (
        <Text align='center' size='sm' tone='muted'>
          {isSignUp ? t('hasAccount') : t('noAccount')}{' '}
          <button className={s.toggleButton} type='button' onClick={() => setMode(isSignUp ? 'signin' : 'signup')}>
            {isSignUp ? t('toggleSignIn') : t('toggleSignUp')}
          </button>
        </Text>
      )}
    </>
  );
};

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { queryClient } from '@/shared/api';
import { AuthProvider } from './AuthProvider';
import { DesktopShell } from './DesktopShell';
import { I18nProvider } from './I18nProvider';

import type { ReactNode } from 'react';

const TOAST_OPTIONS = {
  style: {
    width: '100%',
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    color: 'var(--color-text)',
    background: 'var(--color-surface-raised)',
    border: '1px solid var(--color-border-bright)',
    borderRadius: 'var(--radius-md)',
    boxShadow: '0 20px 44px -22px rgb(0 0 0 / 85%)',
  },
};

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <DesktopShell>
        <AuthProvider>{children}</AuthProvider>
      </DesktopShell>

      <Toaster
        className="vesper-toaster"
        gap={8}
        position="top-center"
        theme="dark"
        toastOptions={TOAST_OPTIONS}
      />
    </I18nProvider>
  </QueryClientProvider>
);

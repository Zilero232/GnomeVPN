'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { VpnConnectionProvider } from '@/features/vpn/connect';
import { queryClient } from '@/shared/api';
import { AuthProvider } from './AuthProvider';
import { DesktopShell } from './DesktopShell';
import { DismissToastOnClick } from './DismissToastOnClick';
import { I18nProvider } from './I18nProvider';
import { MobileInsets } from './MobileInsets';
import { TrayProvider } from './TrayProvider';
import { VaultProvider } from './VaultProvider';

import type { ReactNode } from 'react';

const TOAST_OPTIONS = {
  style: {
    width: 'fit-content',
    maxWidth: '100%',
    marginInline: 'auto',
    gap: '10px',
    padding: '11px 15px',
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    lineHeight: '1.45',
    color: 'var(--color-text)',
    background:
      'linear-gradient(180deg, color-mix(in srgb, var(--color-surface-raised) 96%, white) 0%, var(--color-surface-raised) 100%)',
    border: '1px solid var(--color-border-bright)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 18px 40px -20px rgb(0 0 0 / 80%), 0 1px 0 rgb(255 255 255 / 4%) inset',
    backdropFilter: 'blur(12px)',
  },
};

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <DesktopShell>
        <VaultProvider>
          <VpnConnectionProvider>
            <TrayProvider>
              <AuthProvider>{children}</AuthProvider>
            </TrayProvider>
          </VpnConnectionProvider>
        </VaultProvider>
      </DesktopShell>

      <MobileInsets />
      <DismissToastOnClick />

      <Toaster
        className="gnomevpn-toaster"
        gap={8}
        position="top-center"
        theme="dark"
        toastOptions={TOAST_OPTIONS}
      />
    </I18nProvider>
  </QueryClientProvider>
);

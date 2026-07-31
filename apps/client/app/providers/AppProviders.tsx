'use client';

import type { ReactNode } from 'react';

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

const TOAST_OPTIONS = {
  style: {
    fontFamily: 'var(--font-sans)'
  }
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

      <Toaster className='gnomevpn-toaster' gap={8} position='top-center' theme='dark' toastOptions={TOAST_OPTIONS} />
    </I18nProvider>
  </QueryClientProvider>
);

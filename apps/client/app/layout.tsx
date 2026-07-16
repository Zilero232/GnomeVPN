import 'modern-normalize/modern-normalize.css';

import { AppProviders } from './providers/AppProviders';

import './globals.scss';

import type { ReactNode } from 'react';

export const metadata = { title: 'Vesper', description: 'Vesper VPN' };

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="ru" className="dark">
    <body>
      <AppProviders>{children}</AppProviders>
    </body>
  </html>
);

export default RootLayout;

import localFont from 'next/font/local';

export const fontSans = localFont({
  src: [
    { path: './files/manrope-latin.woff2', weight: '200 800', style: 'normal' },
    { path: './files/manrope-cyrillic.woff2', weight: '200 800', style: 'normal' }
  ],
  variable: '--font-manrope',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif']
});

export const fontMono = localFont({
  src: [
    { path: './files/jetbrains-mono-latin.woff2', weight: '100 800', style: 'normal' },
    { path: './files/jetbrains-mono-cyrillic.woff2', weight: '100 800', style: 'normal' }
  ],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'monospace']
});

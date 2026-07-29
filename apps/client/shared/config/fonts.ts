import { JetBrains_Mono, Manrope } from 'next/font/google';

export const fontSans = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-manrope',
  display: 'swap'
});

export const fontMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap'
});

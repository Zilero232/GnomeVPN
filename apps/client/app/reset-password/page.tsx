import { Suspense } from 'react';

import { createPageMetadata } from '@/shared/seo';
import { ResetPasswordPage } from '@/views/reset-password';

export const metadata = createPageMetadata({
  title: 'Новый пароль',
  description: 'Задайте новый пароль для входа в GnomeVPN.',
  path: '/reset-password',
  index: false,
  follow: false,
});

const Page = () => (
  <Suspense>
    <ResetPasswordPage />
  </Suspense>
);

export default Page;

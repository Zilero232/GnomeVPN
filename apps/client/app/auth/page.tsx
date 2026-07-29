import { createPageMetadata } from '@/shared/seo';
import { AuthPage } from '@/views/auth';

export const metadata = createPageMetadata({
  title: 'Вход',
  description: 'Войдите в GnomeVPN или создайте аккаунт, чтобы оформить подписку и подключиться.',
  path: '/auth',
  index: false
});

const Page = () => <AuthPage />;

export default Page;

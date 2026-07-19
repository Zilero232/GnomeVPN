import { createPageMetadata } from '@/shared/seo';
import { AccountPage } from '@/views/account';

export const metadata = createPageMetadata({
  title: 'Личный кабинет',
  description: 'Статус подписки, оплата и управление автопродлением.',
  path: '/account',
  index: false,
  follow: false,
});

const Page = () => <AccountPage />;

export default Page;

import { createPageMetadata } from '@/shared/seo';
import { AppGate } from '@/views/app-view';

export const metadata = createPageMetadata({
  title: 'Подключение',
  description: 'Выбор страны и управление VPN-туннелем.',
  path: '/app',
  index: false,
  follow: false,
});

const Page = () => <AppGate />;

export default Page;

import { createPageMetadata } from '@/shared/seo';

import { AppRouteGate } from './AppRouteGate';

export const metadata = createPageMetadata({
  title: 'Подключение',
  description: 'Выбор страны и управление VPN-туннелем.',
  path: '/app',
  index: false,
  follow: false
});

const Page = () => <AppRouteGate />;

export default Page;

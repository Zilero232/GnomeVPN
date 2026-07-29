import { createPageMetadata } from '@/shared/seo';
import { PrivacyPage } from '@/views/privacy';

export const metadata = createPageMetadata({
  title: 'Политика конфиденциальности · Privacy Policy',
  description:
    'Как GnomeVPN обрабатывает данные: без логов подключений, минимум сведений. How GnomeVPN handles your data: no connection logs, minimal collection.',
  path: '/privacy',
  index: true,
  follow: true
});

const Page = () => <PrivacyPage />;

export default Page;

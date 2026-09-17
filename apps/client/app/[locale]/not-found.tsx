import { DEFAULT_LOCALE } from '@/shared/i18n';
import { createPageMetadata } from '@/shared/seo';
import { NotFoundView } from '@/views/not-found';

export const metadata = createPageMetadata({
  title: '404',
  description: 'Страница не найдена. Page not found.',
  path: '/404',
  locale: DEFAULT_LOCALE
});

const NotFound = () => <NotFoundView />;

export default NotFound;

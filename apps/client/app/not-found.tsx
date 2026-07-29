import { createPageMetadata } from '@/shared/seo';
import { NotFoundView } from '@/views/not-found';

export const metadata = createPageMetadata({
  title: '404',
  description: 'Страница не найдена.',
  path: '/404',
  index: false,
  follow: false
});

const NotFound = () => <NotFoundView />;

export default NotFound;

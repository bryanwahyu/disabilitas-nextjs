import { createFileRoute } from '@tanstack/react-router';
import ArticleManager from '@/components/admin/ArticleManager';

export const Route = createFileRoute('/admin/dashboard/artikel/')({
  component: ArtikelPage,
});

function ArtikelPage() {
  return <div className="p-6"><ArticleManager /></div>;
}

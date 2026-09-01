import { createFileRoute } from '@tanstack/react-router';
import ForumManager from '@/components/admin/ForumManager';

export const Route = createFileRoute('/admin/dashboard/komunitas/')({
  component: KomunitasPage,
});

function KomunitasPage() {
  return <div className="p-6"><ForumManager /></div>;
}

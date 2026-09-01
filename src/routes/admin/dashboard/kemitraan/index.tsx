import { createFileRoute } from '@tanstack/react-router';
import KemitraanManager from '@/components/admin/KemitraanManager';

export const Route = createFileRoute('/admin/dashboard/kemitraan/')({
  component: KemitraanPage,
});

function KemitraanPage() {
  return <div className="p-6"><KemitraanManager /></div>;
}

import { createFileRoute } from '@tanstack/react-router';
import NotificationManager from '@/components/admin/NotificationManager';

export const Route = createFileRoute('/admin/dashboard/notifikasi/')({
  component: NotifikasiPage,
});

function NotifikasiPage() {
  return <div className="p-6"><NotificationManager /></div>;
}

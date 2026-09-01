import { createFileRoute } from '@tanstack/react-router';
import EventManager from '@/components/admin/EventManager';

export const Route = createFileRoute('/admin/dashboard/acara/')({
  component: AcaraPage,
});

function AcaraPage() {
  return <div className="p-6"><EventManager /></div>;
}

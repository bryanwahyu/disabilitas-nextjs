import { createFileRoute } from '@tanstack/react-router';
import ContactManager from '@/components/admin/ContactManager';

export const Route = createFileRoute('/admin/dashboard/kontak/')({
  component: KontakPage,
});

function KontakPage() {
  return <div className="p-6"><ContactManager /></div>;
}

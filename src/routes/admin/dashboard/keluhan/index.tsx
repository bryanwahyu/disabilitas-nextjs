import { createFileRoute } from '@tanstack/react-router';
import ComplaintManager from '@/components/admin/ComplaintManager';

export const Route = createFileRoute('/admin/dashboard/keluhan/')({
  component: KeluhanAdminPage,
});

function KeluhanAdminPage() {
  return <div className="p-6"><ComplaintManager /></div>;
}

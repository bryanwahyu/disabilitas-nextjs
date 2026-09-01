import { createFileRoute } from '@tanstack/react-router';
import CommissionReport from '@/components/admin/CommissionReport';

export const Route = createFileRoute('/admin/dashboard/komisi/')({
  component: KomisiPage,
});

function KomisiPage() {
  return <div className="p-6"><CommissionReport /></div>;
}

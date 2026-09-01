import { createFileRoute } from '@tanstack/react-router';
import PriceApprovalManager from '@/components/admin/PriceApprovalManager';

export const Route = createFileRoute('/admin/dashboard/harga/')({
  component: HargaPage,
});

function HargaPage() {
  return <div className="p-6"><PriceApprovalManager /></div>;
}

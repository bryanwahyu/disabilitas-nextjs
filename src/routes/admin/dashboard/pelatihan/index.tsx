import { createFileRoute } from '@tanstack/react-router';
import TrainingManager from '@/components/admin/TrainingManager';

export const Route = createFileRoute('/admin/dashboard/pelatihan/')({
  component: PelatihanPage,
});

function PelatihanPage() {
  return <div className="p-6"><TrainingManager /></div>;
}

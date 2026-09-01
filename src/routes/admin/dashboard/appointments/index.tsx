import { createFileRoute } from '@tanstack/react-router';
import AppointmentManager from '@/components/admin/AppointmentManager';

export const Route = createFileRoute('/admin/dashboard/appointments/')({
  component: AppointmentsPage,
});

function AppointmentsPage() {
  return <div className="p-6"><AppointmentManager /></div>;
}

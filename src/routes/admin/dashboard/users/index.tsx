import { createFileRoute } from '@tanstack/react-router';
import UserManager from '@/components/admin/UserManager';

export const Route = createFileRoute('/admin/dashboard/users/')({
  component: UsersPage,
});

function UsersPage() {
  return <div className="p-6"><UserManager /></div>;
}

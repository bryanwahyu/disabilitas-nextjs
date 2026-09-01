
import { useEffect } from 'react';
import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router';
import { Sidebar } from '@/components/admin/Sidebar';
import { useAuth } from '@/hooks/useAuth';

export const Route = createFileRoute('/admin/dashboard')({
  component: DashboardLayout,
});


function DashboardLayout() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ replace: true, to: '/admin/auth' });
    } else if (user.role !== 'admin') {
      navigate({ replace: true, to: '/admin/auth', search: { error: 'forbidden' } });
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (user.role !== 'admin') return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  );
}

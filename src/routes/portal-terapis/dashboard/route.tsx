
import { useEffect, useState } from 'react';
import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router';
import { Sidebar } from '@/components/terapis/Sidebar';

export const Route = createFileRoute('/portal-terapis/dashboard')({
  component: DashboardLayout,
});


function DashboardLayout() {
  const navigate = useNavigate();
  // Token hanya ada di browser, jadi state awal selalu 'checking' — kerangka
  // portal tidak boleh terlanjur tampil untuk pengunjung tanpa sesi.
  const [status, setStatus] = useState<'checking' | 'authed'>('checking');

  useEffect(() => {
    const token = localStorage.getItem('terapis_token');
    if (!token) {
      navigate({ replace: true, to: '/auth' });
      return;
    }
    setStatus('authed');
  }, [navigate]);

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div
          className="h-10 w-10 animate-spin rounded-full border-b-2 border-white"
          role="status"
          aria-label="Memeriksa sesi"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  );
}

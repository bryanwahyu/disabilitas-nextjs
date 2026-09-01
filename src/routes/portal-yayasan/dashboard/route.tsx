import { useEffect, useState } from 'react';
import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router';
import { Sidebar } from '@/components/yayasan/Sidebar';

export const Route = createFileRoute('/portal-yayasan/dashboard')({
  component: DashboardLayout,
});


function DashboardLayout() {
  const navigate = useNavigate();
  // Sama seperti portal terapis: jangan render kerangka portal sebelum sesi
  // terbukti ada (token hanya terbaca di browser).
  const [status, setStatus] = useState<'checking' | 'authed'>('checking');

  useEffect(() => {
    if (!localStorage.getItem('yayasan_token')) {
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

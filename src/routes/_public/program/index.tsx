import { useEffect } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Loader2, Stethoscope } from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { TherapyProgramListItem, TherapyProgramStatus } from '@/lib/api/types';

export const Route = createFileRoute('/_public/program/')({
  head: () => ({
    meta: [
      { title: 'Program Terapi Saya | DisabilitasKu' },
      { name: 'description', content: 'Paket terapi berjalan anak Anda: sisa sesi, jadwal berikutnya, dan perkembangannya.' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ProgramListPage,
});

const STATUS: Record<TherapyProgramStatus, { label: string; className: string }> = {
  draft: { label: 'Belum dibayar', className: 'bg-gray-100 text-gray-700' },
  pending_payment: { label: 'Menunggu pembayaran', className: 'bg-amber-100 text-amber-800' },
  active: { label: 'Berjalan', className: 'bg-emerald-100 text-emerald-800' },
  completed: { label: 'Selesai', className: 'bg-teal-100 text-teal-800' },
  cancelled: { label: 'Dibatalkan', className: 'bg-gray-200 text-gray-600' },
};

function fmtDateTime(s?: string) {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ProgramCard({ p }: { p: TherapyProgramListItem }) {
  const st = STATUS[p.status] ?? STATUS.draft;
  const used = p.total_sessions - p.remaining;
  const pct = p.total_sessions > 0 ? Math.round((used / p.total_sessions) * 100) : 0;
  const next = fmtDateTime(p.next_session_at);
  const belumBayar = p.status === 'draft' || p.status === 'pending_payment';

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">{p.child_name}</p>
            <p className="truncate text-sm text-gray-600">
              {p.title}
              {p.provider_name ? ` · ${p.provider_name}` : ''}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${st.className}`}>{st.label}</span>
        </div>

        {!belumBayar && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {p.attended} sesi dihadiri · sisa {p.remaining} dari {p.total_sessions}
              </span>
              <span>{pct}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-teal-600" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {next && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-700">
            <CalendarClock className="h-4 w-4 text-teal-600" />
            Sesi berikutnya {next}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" variant={belumBayar ? 'outline' : 'default'}>
            <Link to="/program/$id" params={{ id: p.id }}>
              Lihat progres
            </Link>
          </Button>
          {belumBayar && (
            <Button asChild size="sm">
              <Link to="/program/bayar/$id" params={{ id: p.id }}>
                Selesaikan pembayaran
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProgramListPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate({ to: '/auth', search: { redirect: '/program' } });
  }, [authLoading, isAuthenticated, navigate]);

  const { data: programs = [], isPending } = useQuery({
    queryKey: qk.programs.list(),
    queryFn: () => unwrap(apiClient.programs.list()),
    enabled: !authLoading && isAuthenticated,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Program terapi</h1>
        <p className="mt-1 text-sm text-gray-600">
          Paket terapi yang sedang berjalan — sisa sesi, jadwal berikutnya, dan catatan terapis di tiap
          pertemuan.
        </p>
      </header>

      {isPending && (
        <p className="text-sm text-gray-500">
          <Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Memuat…
        </p>
      )}

      {!isPending && programs.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <Stethoscope className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 font-medium text-gray-800">Belum ada program terapi</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-600">
              Terapi berjalan cocok untuk kebutuhan yang butuh pertemuan rutin: satu paket sesi, jadwal tetap
              tiap minggu, dan target yang dinilai bersama terapis.
            </p>
            <Button asChild className="mt-4">
              <Link to="/terapis">Cari terapis</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {programs.map((p) => (
          <ProgramCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}

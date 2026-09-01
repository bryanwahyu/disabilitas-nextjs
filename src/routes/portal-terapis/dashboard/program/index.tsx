import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Loader2, Target, TrendingUp } from 'lucide-react';

import { api, type TherapyProgramListItem } from '@/lib/terapis/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-terapis/dashboard/program/')({
  component: ProgramListPage,
});

const STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Belum dibayar', className: 'bg-slate-700 text-slate-200' },
  pending_payment: { label: 'Menunggu bayar', className: 'bg-amber-500/15 text-amber-300' },
  active: { label: 'Berjalan', className: 'bg-emerald-500/15 text-emerald-300' },
  completed: { label: 'Selesai', className: 'bg-sky-500/15 text-sky-300' },
  cancelled: { label: 'Dibatalkan', className: 'bg-slate-700 text-slate-400' },
};

function fmtDateTime(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ProgramCard({ p }: { p: TherapyProgramListItem }) {
  const st = STATUS[p.status] ?? STATUS.draft;
  const used = p.total_sessions - p.remaining;
  const pct = p.total_sessions > 0 ? Math.round((used / p.total_sessions) * 100) : 0;
  const next = fmtDateTime(p.next_session_at);

  return (
    <Link
      to="/portal-terapis/dashboard/program/$id"
      params={{ id: p.id }}
      className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700 hover:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-100">{p.child_name || 'Tanpa nama'}</p>
          <p className="truncate text-sm text-slate-400">{p.title}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${st.className}`}>{st.label}</span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {used} dari {p.total_sessions} sesi terpakai
          </span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5" /> {p.attended} sesi dihadiri
        </span>
        {next && (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" /> Berikutnya {next}
          </span>
        )}
      </div>
    </Link>
  );
}

function ProgramListPage() {
  const { data: programs = [], isPending, error } = useQuery({
    queryKey: qk.programs.list({ scope: 'therapist' }),
    queryFn: () => api.getPrograms(),
  });

  // Program berjalan lebih dulu: itu yang butuh tindakan hari ini.
  const active = programs.filter((p) => p.status === 'active');
  const others = programs.filter((p) => p.status !== 'active');

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-slate-100">Program Terapi</h1>
        <p className="mt-1 text-sm text-slate-400">
          Paket terapi berjalan yang Anda tangani — target, kehadiran, dan evaluasinya.
        </p>
      </header>

      {isPending && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat program…
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-rose-900/50 bg-rose-950/40 p-3 text-sm text-rose-300">
          Gagal memuat program. Coba muat ulang halaman.
        </p>
      )}

      {!isPending && !error && programs.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
          <Target className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 font-medium text-slate-300">Belum ada program berjalan</p>
          <p className="mt-1 text-sm text-slate-500">
            Program muncul di sini setelah orang tua mengambil paket terapi dengan Anda dan membayarnya.
          </p>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-slate-400">Sedang berjalan ({active.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((p) => (
              <ProgramCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-slate-400">Lainnya ({others.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {others.map((p) => (
              <ProgramCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

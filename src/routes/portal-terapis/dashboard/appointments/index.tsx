import { metaFrom } from '@/lib/seo/head';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { api, type Appointment } from '@/lib/terapis/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-terapis/dashboard/appointments/')({
  head: () => metaFrom(metadata),
  component: AppointmentsPage,
});

const metadata = { title: 'Janji Temu' };

type Tab = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'all';

const TABS: Array<{ value: Tab; label: string }> = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
  { value: 'all', label: 'Semua' },
];

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Menunggu', className: 'bg-amber-500/10 border-amber-500/30 text-amber-300' },
  confirmed: { label: 'Dikonfirmasi', className: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
  completed: { label: 'Selesai', className: 'bg-sky-500/10 border-sky-500/30 text-sky-300' },
  cancelled: { label: 'Dibatalkan', className: 'bg-rose-500/10 border-rose-500/30 text-rose-300' },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

function CardSkeleton() {
  return (
    <li className="rounded-xl border border-slate-800 bg-slate-900 p-4 animate-pulse">
      <div className="h-4 w-40 rounded bg-slate-800 mb-2.5" />
      <div className="h-3 w-64 rounded bg-slate-800" />
    </li>
  );
}

/**
 * Daftar janji temu terapis.
 *
 * Dashboard hanya menampilkan yang menunggu konfirmasi; halaman ini menampung
 * riwayat lengkapnya per status. Sebelum ada halaman ini, terapis tidak punya
 * cara melihat sesi yang sudah dikonfirmasi maupun yang sudah lewat — endpoint
 * `/me/appointments` sudah ada sejak lama tapi tidak pernah dipanggil portal.
 */
function AppointmentsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('pending');

  const { data: appointments = [], isPending } = useQuery({
    queryKey: qk.terapis.appointments.list(),
    queryFn: async () => (await api.getAppointments()).data,
  });

  const { mutate: setStatus, isPending: updating } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'confirmed' | 'cancelled' | 'completed' }) =>
      api.setAppointmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.terapis.appointments.all() }),
  });

  const counts = appointments.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  const now = Date.now();
  const shown = (tab === 'all' ? appointments : appointments.filter((a) => a.status === tab))
    // Terbaru dulu; untuk yang menunggu, yang paling dekat waktunya lebih genting.
    .slice()
    .sort((a, b) =>
      tab === 'pending'
        ? new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
        : new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
    );

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-2">Janji Temu</h1>
      <p className="text-slate-400 text-sm mb-6">
        Permintaan yang masuk beserta riwayat sesi Anda.
      </p>

      <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Filter status janji temu">
        {TABS.map((t) => {
          const active = tab === t.value;
          const count = t.value === 'all' ? appointments.length : counts[t.value] ?? 0;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? 'border-teal-500/40 bg-teal-500/10 text-teal-300'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {isPending ? (
        <ul className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </ul>
      ) : shown.length === 0 ? (
        <p className="text-sm text-slate-500 py-8">
          {tab === 'pending'
            ? 'Tidak ada permintaan yang menunggu konfirmasi.'
            : 'Belum ada janji temu pada status ini.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((appt: Appointment) => {
            const status = STATUS[appt.status] ?? {
              label: appt.status,
              className: 'bg-slate-700/40 border-slate-600 text-slate-400',
            };
            const isPast = new Date(appt.end_at).getTime() < now;
            return (
              <li
                key={appt.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-medium">{appt.user_name || 'Klien'}</p>
                    <span className={`rounded-lg border px-2 py-0.5 text-xs ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {fmtDate(appt.start_at)} · {fmtTime(appt.start_at)}–{fmtTime(appt.end_at)}
                  </p>
                  {appt.notes && (
                    <p className="text-xs text-slate-500 mt-1 italic">&quot;{appt.notes}&quot;</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {appt.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => setStatus({ id: appt.id, status: 'confirmed' })}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Konfirmasi
                      </button>
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => setStatus({ id: appt.id, status: 'cancelled' })}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Tolak
                      </button>
                    </>
                  )}
                  {appt.status === 'confirmed' && isPast && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => setStatus({ id: appt.id, status: 'completed' })}
                      className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-sm text-sky-300 hover:bg-sky-500/20 disabled:opacity-50"
                    >
                      Tandai selesai
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

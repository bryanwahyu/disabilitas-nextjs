import { metaFrom } from '@/lib/seo/head';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { api, type Appointment } from '@/lib/terapis/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-terapis/dashboard/')({
  head: () => metaFrom(metadata),
  component: DashboardPage,
});

const metadata = { title: 'Dashboard Terapis' };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const isSameDay = (iso: string, ref: Date) => {
  const d = new Date(iso);
  return d.toDateString() === ref.toDateString();
};

const isSameMonth = (iso: string, ref: Date) => {
  const d = new Date(iso);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
};

/**
 * Dashboard portal terapis.
 *
 * Keempat kartu statistik sebelumnya berisi tanda "—" harfiah dan tidak ada
 * daftar appointment sama sekali: terapis tidak punya cara melihat, apalagi
 * mengonfirmasi, permintaan yang masuk. Angkanya sekarang dihitung dari
 * `/me/appointments`, dan permintaan berstatus `pending` bisa dikonfirmasi atau
 * ditolak langsung dari sini.
 */
function DashboardPage() {
  const qc = useQueryClient();

  const { data: appointments = [], isPending } = useQuery({
    queryKey: qk.terapis.appointments.list(),
    queryFn: async () => (await api.getAppointments()).data,
  });

  const { data: me } = useQuery({
    queryKey: qk.terapis.profile.detail('me'),
    queryFn: () => api.getMe(),
  });

  const { data: rating } = useQuery({
    queryKey: qk.terapis.reviews.of('summary', { uid: me?.ID ?? '' }),
    queryFn: () => api.getReviewSummary(me!.ID),
    enabled: !!me?.ID,
  });

  // Jadwal dipakai untuk mengecek syarat tampil di direktori publik.
  const { data: schedule } = useQuery({
    queryKey: qk.terapis.schedule.detail('me'),
    queryFn: () => api.getSchedule().catch(() => null),
    retry: false,
  });

  /*
   * Syarat tampil di direktori publik: punya spesialisasi ATAU jadwal aktif
   * (lihat therapy.Repository.Search). Terapis yang belum memenuhinya tidak
   * muncul sama sekali di /terapis — dan tanpa peringatan ini ia tidak punya
   * cara tahu, cuma merasa tak pernah dapat pasien.
   */
  const hasSpecialization = !!me?.Profile?.specialization?.trim();
  const hasActiveSchedule = !!schedule?.schedule?.is_active && (schedule?.slots ?? []).length > 0;
  const hiddenFromDirectory = !!me && !hasSpecialization && !hasActiveSchedule;

  const { mutate: setStatus, isPending: updating } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'confirmed' | 'cancelled' }) =>
      api.setAppointmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.terapis.appointments.all() }),
  });

  const now = new Date();
  const active = appointments.filter((a) => a.status !== 'cancelled');
  const today = active.filter((a) => isSameDay(a.start_at, now));
  const pending = appointments.filter((a) => a.status === 'pending');
  const doneThisMonth = appointments.filter(
    (a) => a.status === 'completed' && isSameMonth(a.start_at, now)
  );

  const stats = [
    {
      label: 'Appointment Hari Ini',
      value: today.length,
      color: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    },
    {
      label: 'Pending',
      value: pending.length,
      color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    },
    {
      label: 'Selesai Bulan Ini',
      value: doneThisMonth.length,
      color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    },
    {
      // `null` berarti benar-benar belum ada ulasan — ditandai apa adanya,
      // bukan diisi angka yang tidak punya dasar.
      label: 'Rating',
      value: rating && rating.total_reviews > 0 ? rating.average_rating.toFixed(1) : null,
      color: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Dashboard Terapis</h1>
      <p className="text-slate-400 text-sm mb-8">Selamat datang di Portal Terapis DisabilitasKu.id</p>

      {hiddenFromDirectory && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5"
        >
          <p className="text-amber-200 font-medium mb-1">
            Profil Anda belum tampil di pencarian terapis
          </p>
          <p className="text-sm text-amber-200/80">
            Direktori publik hanya menampilkan terapis yang sudah mengisi spesialisasi atau
            mengatur jadwal praktik. Selama keduanya kosong, orang tua tidak menemukan Anda di
            halaman Terapis.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              to="/portal-terapis/dashboard/profil"
              className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-sm text-amber-100 hover:bg-amber-500/30"
            >
              Isi spesialisasi
            </Link>
            <Link
              to="/portal-terapis/dashboard/jadwal"
              className="rounded-lg border border-amber-500/30 px-3 py-1.5 text-sm text-amber-200 hover:bg-amber-500/10"
            >
              Atur jadwal praktik
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`border rounded-xl p-5 ${stat.color}`}>
            <p className="text-xs font-medium opacity-70 mb-2">{stat.label}</p>
            <p className="text-3xl font-bold">
              {isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" aria-label="Memuat" />
              ) : stat.value === null ? (
                <span className="text-base font-medium opacity-60">Belum ada ulasan</span>
              ) : (
                stat.value
              )}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Permintaan Menunggu Konfirmasi</h2>
          <Link
            to="/portal-terapis/dashboard/jadwal"
            className="text-sm text-teal-400 hover:text-teal-300"
          >
            Atur jadwal
          </Link>
        </div>

        {isPending ? (
          <div className="flex items-center gap-3 text-slate-400 text-sm py-8">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat permintaan…
          </div>
        ) : pending.length === 0 ? (
          <p className="text-slate-500 text-sm py-8">
            Belum ada permintaan baru. Permintaan masuk akan muncul di sini beserta tombol
            konfirmasi.
          </p>
        ) : (
          <ul className="space-y-3">
            {pending.map((appt: Appointment) => (
              <li
                key={appt.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1">
                  <p className="text-white font-medium">{appt.user_name || 'Klien'}</p>
                  <p className="text-sm text-slate-400">
                    {fmtDate(appt.start_at)} · {fmtTime(appt.start_at)}–{fmtTime(appt.end_at)}
                  </p>
                  {appt.notes && (
                    <p className="text-xs text-slate-500 mt-1 italic">&quot;{appt.notes}&quot;</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => setStatus({ id: appt.id, status: 'confirmed' })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Konfirmasi
                  </button>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => setStatus({ id: appt.id, status: 'cancelled' })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Tolak
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white mb-4">Jadwal Hari Ini</h2>
        {isPending ? null : today.length === 0 ? (
          <p className="text-slate-500 text-sm">Tidak ada sesi hari ini.</p>
        ) : (
          <ul className="space-y-2">
            {today.map((appt) => (
              <li
                key={appt.id}
                className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <span className="text-white text-sm">{appt.user_name || 'Klien'}</span>
                <span className="text-slate-400 text-sm">
                  {fmtTime(appt.start_at)}–{fmtTime(appt.end_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

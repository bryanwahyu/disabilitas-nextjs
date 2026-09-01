import { metaFrom } from '@/lib/seo/head';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Loader2, MapPin, Users } from 'lucide-react';
import { api } from '@/lib/terapis/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-terapis/dashboard/pelatihan/')({
  head: () => metaFrom(metadata),
  component: PelatihanPage,
});

const metadata = { title: 'Pelatihan Saya' };

const STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draf', className: 'bg-slate-700/40 border-slate-600 text-slate-300' },
  pending: { label: 'Menunggu persetujuan', className: 'bg-amber-500/10 border-amber-500/30 text-amber-300' },
  published: { label: 'Tayang', className: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
  rejected: { label: 'Ditolak', className: 'bg-rose-500/10 border-rose-500/30 text-rose-300' },
  closed: { label: 'Ditutup', className: 'bg-slate-700/40 border-slate-600 text-slate-400' },
  completed: { label: 'Selesai', className: 'bg-slate-700/40 border-slate-600 text-slate-400' },
};

const TYPE_LABEL: Record<string, string> = {
  online: 'Online',
  offline: 'Tatap muka',
  hybrid: 'Hybrid',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Pelatihan yang diselenggarakan terapis ini.
 *
 * `/me/trainings` menyaring berdasarkan `created_by`, jadi isinya pelatihan
 * yang ia buat — bukan yang ia ikuti. Halaman ini sebelumnya stub, sehingga
 * pelatihan yang sudah diajukan tidak bisa dipantau statusnya sama sekali;
 * status `pending` khususnya penting karena menunggu persetujuan admin.
 */
function PelatihanPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: qk.terapis.myTrainings.list(),
    queryFn: () => api.getMyTrainings(),
  });

  const trainings = data?.data ?? [];

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-2">Pelatihan Saya</h1>
      <p className="text-slate-400 text-sm mb-8">
        Pelatihan yang Anda selenggarakan beserta status tayangnya di DisabilitasKu.
      </p>

      {isPending ? (
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat pelatihan…
        </div>
      ) : isError ? (
        <p className="text-sm text-rose-400">Gagal memuat daftar pelatihan. Coba muat ulang halaman.</p>
      ) : trainings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-white font-medium mb-1">Belum ada pelatihan</p>
          <p className="text-sm text-slate-400">
            Anda belum menyelenggarakan pelatihan. Pengajuan pelatihan baru saat ini lewat admin
            DisabilitasKu; setelah disetujui, statusnya muncul di halaman ini.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {trainings.map((t) => {
            const status = STATUS[t.status] ?? {
              label: t.status,
              className: 'bg-slate-700/40 border-slate-600 text-slate-400',
            };
            return (
              <li key={t.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <p className="text-white font-medium">{t.title}</p>
                  <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    {fmtDate(t.start_date)}
                    {t.end_date ? ` – ${fmtDate(t.end_date)}` : ''}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {TYPE_LABEL[t.training_type] ?? t.training_type}
                    {t.location ? ` · ${t.location}` : ''}
                  </span>
                  {t.max_participants && (
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      Maks. {t.max_participants} peserta
                    </span>
                  )}
                  <span>
                    {t.is_free
                      ? 'Gratis'
                      : `Rp ${new Intl.NumberFormat('id-ID').format(t.price)}`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

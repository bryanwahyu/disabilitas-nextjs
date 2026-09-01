import { metaFrom } from '@/lib/seo/head';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Building2, Loader2, Lock, UserCheck } from 'lucide-react';
import { api, type Affiliation } from '@/lib/terapis/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-terapis/dashboard/afiliasi/')({
  head: () => metaFrom(metadata),
  component: AfiliasiPage,
});

const metadata = { title: 'Afiliasi Yayasan' };

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active: { label: 'Aktif', className: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
  pending: { label: 'Menunggu persetujuan', className: 'bg-amber-500/10 border-amber-500/30 text-amber-300' },
  inactive: { label: 'Tidak aktif', className: 'bg-slate-700/40 border-slate-600 text-slate-400' },
};

/**
 * Status afiliasi terapis dengan yayasan/klinik.
 *
 * Halaman ini sebelumnya stub, padahal status di sinilah yang menentukan
 * apakah terapis boleh mengatur jadwalnya sendiri: yang dikelola yayasan
 * diblokir backend dengan `403 MANAGED_BY_YAYASAN`. Tanpa halaman ini, terapis
 * hanya melihat halaman jadwalnya read-only tanpa penjelasan apa pun.
 */
function AfiliasiPage() {
  const { data: affiliations = [], isPending } = useQuery({
    queryKey: qk.terapis.affiliations.list(),
    // Terapis independen tidak punya afiliasi — kegagalan di sini bukan error
    // yang perlu ditampilkan, cukup daftar kosong.
    queryFn: () => api.getMyAffiliations().catch((): Affiliation[] => []),
    retry: false,
  });

  const active = affiliations.find((a) => a.status === 'active');

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-2">Afiliasi Yayasan</h1>
      <p className="text-slate-400 text-sm mb-8">
        Status hubungan Anda dengan yayasan atau klinik yang terdaftar di DisabilitasKu.
      </p>

      {isPending ? (
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat status afiliasi…
        </div>
      ) : affiliations.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <UserCheck className="h-5 w-5 text-teal-400 mt-0.5" />
            <div>
              <p className="text-white font-medium mb-1">Anda terapis independen</p>
              <p className="text-sm text-slate-400">
                Tidak ada yayasan yang mengelola akun Anda, jadi jadwal praktik Anda atur sendiri
                lewat{' '}
                <Link to="/portal-terapis/dashboard/jadwal" className="text-teal-400 hover:text-teal-300">
                  halaman Jadwal
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {affiliations.map((a) => {
              const status = STATUS_LABEL[a.status] ?? {
                label: a.status,
                className: 'bg-slate-700/40 border-slate-600 text-slate-400',
              };
              return (
                <li
                  key={a.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-white font-medium">{a.location_name || 'Lokasi terapi'}</p>
                      <p className="text-xs text-slate-500 font-mono">{a.location_id.slice(0, 8)}…</p>
                    </div>
                  </div>
                  <span className={`rounded-lg border px-3 py-1 text-xs ${status.className}`}>
                    {status.label}
                  </span>
                </li>
              );
            })}
          </ul>

          {active && (
            <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium mb-1">Jadwal Anda diatur {active.location_name}</p>
                  <p className="text-sm text-slate-400">
                    Selama afiliasi ini aktif, halaman Jadwal hanya bisa dibaca — perubahan jam
                    praktik diajukan lewat yayasan. Ini dikunci di server, bukan sekadar
                    disembunyikan di tampilan.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

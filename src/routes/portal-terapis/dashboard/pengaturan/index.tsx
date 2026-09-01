import { metaFrom } from '@/lib/seo/head';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, KeyRound, Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { api, TERAPIS_TOKEN_KEY } from '@/lib/terapis/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-terapis/dashboard/pengaturan/')({
  head: () => metaFrom(metadata),
  component: PengaturanPage,
});

const metadata = { title: 'Pengaturan Akun' };

const ROLE_LABEL: Record<string, string> = {
  therapist_independent: 'Terapis independen',
  therapy: 'Yayasan / klinik',
};

/**
 * Pengaturan akun terapis.
 *
 * Sengaja sempit: backend belum punya endpoint ganti-password-saat-login,
 * jadi tombolnya memakai alur reset lewat email yang memang ada
 * (`POST /auth/password/reset-request`) — bukan form yang tidak punya tujuan.
 * Data profil publik diatur di halaman Profil, tidak diduplikasi di sini.
 */
function PengaturanPage() {
  const navigate = useNavigate();

  const { data: me, isPending } = useQuery({
    queryKey: qk.terapis.profile.detail('me'),
    queryFn: () => api.getMe(),
  });

  const {
    mutate: sendReset,
    isPending: sending,
    isSuccess: sent,
    error: resetError,
  } = useMutation({
    mutationFn: () => api.requestPasswordReset(me!.Email),
  });

  const handleLogout = () => {
    localStorage.removeItem(TERAPIS_TOKEN_KEY);
    navigate({ replace: true, to: '/portal-terapis/auth' });
  };

  if (isPending) {
    return (
      <div className="p-8 flex items-center gap-3 text-slate-400 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat akun…
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">Pengaturan Akun</h1>
      <p className="text-slate-400 text-sm mb-8">
        Data akun dan keamanan. Profil yang dilihat orang tua diatur di{' '}
        <Link to="/portal-terapis/dashboard/profil" className="text-teal-400 hover:text-teal-300">
          halaman Profil
        </Link>
        .
      </p>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-5">
        <h2 className="text-sm font-medium text-white mb-4">Identitas Akun</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Email</dt>
            <dd className="text-white">{me?.Email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Peran</dt>
            <dd className="text-white">{ROLE_LABEL[me?.Role ?? ''] ?? me?.Role}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Status verifikasi</dt>
            <dd className={me?.Profile?.is_verified ? 'text-emerald-400' : 'text-slate-400'}>
              {me?.Profile?.is_verified ? (
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Terverifikasi
                </span>
              ) : (
                'Belum diverifikasi'
              )}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-slate-500 mt-4">
          Email dan peran akun diubah lewat admin DisabilitasKu.
        </p>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-5">
        <h2 className="text-sm font-medium text-white mb-2">Password</h2>
        <p className="text-sm text-slate-400 mb-4">
          Kami kirimkan tautan ganti password ke <span className="text-slate-300">{me?.Email}</span>.
          Tautan berlaku terbatas dan hanya bisa dipakai sekali.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => sendReset()}
            disabled={sending || !me?.Email}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-600 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Kirim tautan ganti password
          </button>
          {sent && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Tautan terkirim
            </span>
          )}
        </div>
        {resetError && (
          <p role="alert" className="text-sm text-rose-400 mt-3">
            {(resetError as Error).message || 'Gagal mengirim tautan.'}
          </p>
        )}
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-white mb-2">Sesi</h2>
        <p className="text-sm text-slate-400 mb-4">
          Keluar akan menghapus sesi di perangkat ini saja.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/20"
        >
          <LogOut className="h-4 w-4" />
          Keluar dari portal
        </button>
      </section>
    </div>
  );
}

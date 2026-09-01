import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, MailWarning } from 'lucide-react';
import { env } from '@/lib/env';

export const Route = createFileRoute('/verifikasi-email/')({
  /*
   * Halaman akun: `noindex`.
   *
   * Isinya hanya berarti bagi pemilik tautan di email, dan URL-nya membawa
   * token — tidak ada gunanya di hasil pencarian.
   */
  head: () => ({
    meta: [
      { title: 'Konfirmasi Email | DisabilitasKu' },
      { name: 'description', content: 'Konfirmasi alamat email akun DisabilitasKu Anda.' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),

  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),

  component: VerifikasiEmailPage,
});

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; email?: string }
  | { kind: 'error'; code?: string; message: string };

/**
 * Tukar token dari email jadi akun aktif.
 *
 * Verifikasi dijalankan sekali saat halaman dibuka — pengguna sudah "mengklik"
 * di email, meminta klik kedua di sini hanya menambah langkah. Bila tautannya
 * kedaluwarsa atau sudah dipakai, halaman menawarkan kirim ulang alih-alih
 * membuat orang menebak apa yang salah.
 */
function VerifikasiEmailPage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [email, setEmail] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  useEffect(() => {
    if (!token) {
      setState({ kind: 'error', message: 'Tautan tidak lengkap — buka lagi tautan dari email Anda.' });
      return;
    }

    let cancelled = false;
    setState({ kind: 'loading' });

    fetch(`${env.apiBaseUrl}/auth/email/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setState({
            kind: 'error',
            code: json.code,
            message: json.message || 'Konfirmasi gagal. Minta tautan baru.',
          });
          return;
        }
        setState({ kind: 'ok', email: json.data?.email });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ kind: 'error', message: 'Tidak bisa menghubungi server. Coba lagi sebentar lagi.' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const resend = async () => {
    if (!email.trim()) return;
    setResendState('sending');
    try {
      await fetch(`${env.apiBaseUrl}/auth/email/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
    } finally {
      // Jawaban server sengaja seragam apa pun keadaan akunnya, jadi tidak ada
      // yang perlu dibedakan di sini.
      setResendState('sent');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Konfirmasi Email</h1>

        {state.kind === 'loading' && (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memeriksa tautan…
          </p>
        )}

        {state.kind === 'ok' && (
          <>
            <p className="flex items-center gap-2 text-emerald-700 font-medium mb-2">
              <CheckCircle2 className="h-5 w-5" />
              Email terkonfirmasi
            </p>
            <p className="text-sm text-gray-600 mb-6">
              {state.email ? `${state.email} sudah aktif. ` : ''}
              Akun Anda siap dipakai — masuk lewat Portal Terapis.
            </p>
            <a
              href="https://terapis.disabilitasku.id/portal-terapis/auth"
              className="inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              Masuk ke Portal Terapis
            </a>
          </>
        )}

        {state.kind === 'error' && (
          <>
            <p className="flex items-center gap-2 text-amber-700 font-medium mb-2">
              <MailWarning className="h-5 w-5" />
              Tautan tidak bisa dipakai
            </p>
            <p className="text-sm text-gray-600 mb-6">{state.message}</p>

            {resendState === 'sent' ? (
              <p className="text-sm text-emerald-700">
                Jika akun tersebut ada dan belum terkonfirmasi, tautan baru sudah dikirim. Cek kotak
                masuk dan folder spam.
              </p>
            ) : (
              <div className="space-y-2">
                <label htmlFor="resend-email" className="block text-sm font-medium text-gray-700">
                  Kirim ulang tautan ke
                </label>
                <input
                  id="resend-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email yang Anda daftarkan"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={resend}
                  disabled={resendState === 'sending' || !email.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {resendState === 'sending' ? 'Mengirim…' : 'Kirim ulang'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

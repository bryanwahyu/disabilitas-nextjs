
import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Loader2, CheckCircle, Mail } from 'lucide-react';
import { env } from '@/lib/env';

export const Route = createFileRoute('/portal-terapis/auth/')({
  component: TerapisLoginPage,
});


type View = 'login' | 'forgot' | 'sent';

function TerapisLoginPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('login');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const base = env.apiBaseUrl;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Akun terapis baru aktif setelah emailnya dikonfirmasi. Kodenya
        // dibedakan supaya yang muncul tawaran kirim ulang tautan, bukan pesan
        // "password salah" yang menyesatkan.
        if (json.code === 'EMAIL_NOT_VERIFIED') {
          setNeedsVerification(true);
          setError('');
          return;
        }
        setError(json.message || 'Email atau password salah.');
        return;
      }
      const token = json.data?.access_token;
      if (!token) { setError('Token tidak ditemukan.'); return; }

      const meRes = await fetch(`${base}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meJson = await meRes.json();
      const role = meJson.data?.Role || meJson.data?.role;
      if (role !== 'therapist_independent') {
        setError('Akses ditolak. Portal ini khusus untuk terapis independen.');
        return;
      }
      localStorage.setItem('terapis_token', token);
      // Prefix portal wajib ditulis penuh: `/dashboard` menunjuk ke dashboard
      // portal PUBLIK, bukan portal terapis (tidak ada rewrite host→path seperti
      // middleware Next).
      navigate({ to: '/portal-terapis/dashboard' });
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await fetch(`${base}/auth/password/reset-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const json = await res.json();
      if (!res.ok) {
        setForgotError(json.message || 'Gagal mengirim email reset.');
        return;
      }
      setView('sent');
    } catch {
      setForgotError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Portal Terapis</h1>
          <p className="text-slate-400 text-sm mt-1">DisabilitasKu.id — Terapis Independen</p>
        </div>

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <button type="button" onClick={() => { setView('forgot'); setForgotEmail(email); setForgotError(''); }}
                  className="text-xs text-teal-400 hover:text-teal-300 hover:underline">
                  Lupa password?
                </button>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Memproses...' : 'Masuk ke Portal Terapis'}
            </button>

            {needsVerification && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                <p className="font-medium mb-1">Email belum dikonfirmasi</p>
                <p className="text-amber-200/80 mb-3">
                  Akun Anda sudah dibuat, tapi belum bisa masuk sampai tautan konfirmasi di email
                  dibuka. Cek kotak masuk dan folder spam.
                </p>
                {resendState === 'sent' ? (
                  <p className="text-amber-100">Tautan baru sudah dikirim ke {email}.</p>
                ) : (
                  <button
                    type="button"
                    disabled={resendState === 'sending' || !email}
                    onClick={async () => {
                      setResendState('sending');
                      try {
                        await fetch(`${base}/auth/email/resend`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email }),
                        });
                      } finally {
                        setResendState('sent');
                      }
                    }}
                    className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    {resendState === 'sending' ? 'Mengirim…' : 'Kirim ulang tautan konfirmasi'}
                  </button>
                )}
              </div>
            )}

            {/*
              Portal ini tidak punya form pendaftaran sendiri — akun terapis
              dibuat lewat situs publik (atau dibuatkan yayasan). Sebelumnya
              tidak ada petunjuk apa pun di sini, jadi terapis baru yang mendarat
              di terapis.disabilitasku.id menemui jalan buntu.
            */}
            <p className="text-center text-xs text-slate-500 pt-1">
              Belum punya akun terapis?{' '}
              <a
                href="https://disabilitasku.id/auth"
                className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
              >
                Daftar di disabilitasku.id
              </a>
              , pilih peran &quot;Terapis&quot;.
            </p>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-sm text-slate-300 font-medium">Lupa Password</p>
              <p className="text-xs text-slate-500 mt-1">Masukkan email Anda — kami kirimkan link reset.</p>
            </div>
            {forgotError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{forgotError}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
            </div>
            <button type="submit" disabled={forgotLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2">
              {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {forgotLoading ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>
            <button type="button" onClick={() => setView('login')}
              className="w-full text-slate-400 hover:text-white text-sm py-2">
              ← Kembali ke login
            </button>
          </form>
        )}

        {view === 'sent' && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-teal-500/20 mx-auto">
              <CheckCircle className="w-7 h-7 text-teal-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Email terkirim!</p>
              <p className="text-slate-400 text-sm mt-1">
                Cek inbox <strong className="text-slate-200">{forgotEmail}</strong> dan ikuti link reset password.
              </p>
            </div>
            <button onClick={() => { setView('login'); setForgotEmail(''); }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg py-2.5 transition-colors">
              Kembali ke Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

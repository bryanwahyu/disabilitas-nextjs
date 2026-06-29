'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, Mail } from 'lucide-react';

type View = 'login' | 'forgot' | 'sent';

export default function YayasanLoginPage() {
  const router = useRouter();
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

  const base = process.env.NEXT_PUBLIC_API_BASE_URL;

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
      if (role !== 'therapy') {
        setError('Akses ditolak. Portal ini khusus untuk pemilik yayasan/klinik.');
        return;
      }
      localStorage.setItem('yayasan_token', token);
      router.push('/dashboard');
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Portal Yayasan</h1>
          <p className="text-slate-400 text-sm mt-1">DisabilitasKu.id — Yayasan & Klinik</p>
        </div>

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <button type="button" onClick={() => { setView('forgot'); setForgotEmail(email); setForgotError(''); }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline">
                  Lupa password?
                </button>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Memproses...' : 'Masuk ke Portal Yayasan'}
            </button>
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
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={forgotLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2">
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
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-500/20 mx-auto">
              <CheckCircle className="w-7 h-7 text-indigo-400" />
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

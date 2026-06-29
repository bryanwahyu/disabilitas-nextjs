'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Bell, LogOut, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/yayasan/api';

export default function PengaturanPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const [notif, setNotif] = useState({ appointment: true, ulasan: true, pelatihan: false });
  const toggle = (k: keyof typeof notif) => setNotif(p => ({ ...p, [k]: !p[k] }));

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setResetLoading(true);
    setResetError('');
    try {
      await api.requestPasswordReset(email);
      setResetSent(true);
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Gagal mengirim email reset');
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Pengaturan</h1>
        <p className="text-slate-400 text-sm">Keamanan akun dan preferensi notifikasi</p>
      </div>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Ubah Password</h2>
        </div>
        {resetSent ? (
          <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-emerald-400">
              Link reset password telah dikirim ke <strong>{email}</strong>. Cek inbox email Anda.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-3">
            <p className="text-xs text-slate-500">Masukkan email akun Anda — kami akan mengirimkan link reset password.</p>
            {resetError && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{resetError}</p>}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Akun</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@yayasan.id"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <button type="submit" disabled={resetLoading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
              {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {resetLoading ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>
          </form>
        )}
      </section>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Preferensi Notifikasi</h2>
        </div>
        <div className="space-y-3">
          {([
            ['appointment', 'Appointment Baru Masuk'],
            ['ulasan', 'Ulasan Baru dari Pengguna'],
            ['pelatihan', 'Update Pendaftar Pelatihan'],
          ] as [keyof typeof notif, string][]).map(([k, l]) => (
            <label key={k} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 cursor-pointer">
              <span className="text-sm text-slate-300">{l}</span>
              <div onClick={() => toggle(k)} className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${notif[k] ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notif[k] ? 'translate-x-4' : ''}`} />
              </div>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3">Preferensi notifikasi disimpan lokal. Integrasi email notifikasi segera hadir.</p>
      </section>

      <button
        onClick={() => { localStorage.removeItem('yayasan_token'); router.push('/auth'); }}
        className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-4 py-2.5 rounded-lg transition-colors">
        <LogOut className="w-4 h-4" /> Keluar dari Portal Yayasan
      </button>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Building2, Save, Loader2 } from 'lucide-react';
import { api } from '@/lib/yayasan/api';

export default function ProfilPage() {
  const [uid, setUid] = useState('');
  const [form, setForm] = useState({
    full_name: '', phone: '', city: '', bio: '', company_website: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMe()
      .then(me => {
        setUid(me.ID);
        setForm({
          full_name: me.Profile?.FullName ?? '',
          phone: me.Profile?.Phone ?? '',
          city: me.Profile?.City ?? '',
          bio: me.Profile?.Bio ?? '',
          company_website: me.Profile?.CompanyWebsite ?? '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    setError('');
    try {
      await api.updateProfile(uid, {
        full_name: form.full_name || undefined,
        phone: form.phone || undefined,
        city: form.city || undefined,
        bio: form.bio || undefined,
        company_website: form.company_website || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Profil Yayasan</h1>
        <p className="text-slate-400 text-sm">Informasi institusi yang ditampilkan ke publik</p>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{form.full_name || 'Nama belum diisi'}</p>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">{uid.slice(0, 8)}…</p>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs mb-4 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Nama Yayasan / Klinik</label>
          <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
            placeholder="PT / Yayasan ..."
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Nomor Telepon</label>
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="021-..."
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Kota</label>
          <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
            placeholder="Jakarta, Bandung, ..."
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Website</label>
          <input value={form.company_website} onChange={e => setForm(p => ({ ...p, company_website: e.target.value }))}
            placeholder="https://yayasan.id"
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Deskripsi</label>
          <textarea rows={4} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
            placeholder="Ceritakan tentang yayasan Anda..."
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 resize-none" />
        </div>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
}

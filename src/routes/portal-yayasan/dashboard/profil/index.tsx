import { createFileRoute } from '@tanstack/react-router';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Save, Loader2 } from 'lucide-react';
import { api, MeUser } from '@/lib/yayasan/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-yayasan/dashboard/profil/')({
  component: ProfilPage,
});


type ProfileForm = {
  full_name: string; phone: string; city: string; bio: string; company_website: string;
};

function formFromMe(me?: MeUser): ProfileForm {
  return {
    full_name: me?.Profile?.FullName ?? '',
    phone: me?.Profile?.Phone ?? '',
    city: me?.Profile?.City ?? '',
    bio: me?.Profile?.Bio ?? '',
    company_website: me?.Profile?.CompanyWebsite ?? '',
  };
}

function ProfilPage() {
  const qc = useQueryClient();
  // null selama belum diketik: isian mengikuti data server tanpa perlu efek sinkronisasi.
  const [draft, setDraft] = useState<ProfileForm | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data: me, isPending: loading } = useQuery({
    queryKey: qk.me(),
    queryFn: () => api.getMe(),
  });
  const uid = me?.ID ?? '';
  const form = draft ?? formFromMe(me);

  function setForm(next: Partial<ProfileForm>) {
    setDraft({ ...form, ...next });
  }

  const { mutate: saveProfile, isPending: saving } = useMutation({
    mutationFn: (body: ProfileForm) =>
      api.updateProfile(uid, {
        full_name: body.full_name || undefined,
        phone: body.phone || undefined,
        city: body.city || undefined,
        bio: body.bio || undefined,
        company_website: body.company_website || undefined,
      }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      qc.invalidateQueries({ queryKey: qk.me() });
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setError('');
    saveProfile(form);
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
          <input value={form.full_name} onChange={e => setForm({ full_name: e.target.value })}
            placeholder="PT / Yayasan ..."
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Nomor Telepon</label>
          <input value={form.phone} onChange={e => setForm({ phone: e.target.value })}
            placeholder="021-..."
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Kota</label>
          <input value={form.city} onChange={e => setForm({ city: e.target.value })}
            placeholder="Jakarta, Bandung, ..."
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Website</label>
          <input value={form.company_website} onChange={e => setForm({ company_website: e.target.value })}
            placeholder="https://yayasan.id"
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Deskripsi</label>
          <textarea rows={4} value={form.bio} onChange={e => setForm({ bio: e.target.value })}
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

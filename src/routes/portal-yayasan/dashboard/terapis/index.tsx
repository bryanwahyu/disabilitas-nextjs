import { createFileRoute } from '@tanstack/react-router';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, MapPin, Mail, Trash2, Loader2, ChevronDown, Plus, Copy, CheckCircle2 } from 'lucide-react';
import { api, Affiliation, CreatedTherapist } from '@/lib/yayasan/api';
import { qk } from '@/lib/query/keys';
import { validatePassword } from '@/lib/validation';

export const Route = createFileRoute('/portal-yayasan/dashboard/terapis/')({
  component: TerapisPage,
});


const statusColor: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  inactive: 'bg-slate-700 text-slate-400 border-slate-600',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};
const statusLabel: Record<string, string> = {
  active: 'Aktif', pending: 'Menunggu', inactive: 'Nonaktif', rejected: 'Ditolak',
};

function TerapisPage() {
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [selectedInviteLocationId, setSelectedInviteLocationId] = useState('');
  const [inviteTherapistId, setInviteTherapistId] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Buat akun terapis baru
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', password: '', location_id: '' });
  const [createError, setCreateError] = useState('');
  const [created, setCreated] = useState<CreatedTherapist | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: me, isPending: loadingMe } = useQuery({
    queryKey: qk.me(),
    queryFn: () => api.getMe(),
  });
  const providerId = me?.ID ?? '';

  const { data: locations = [], isPending: loadingLocationsQuery } = useQuery({
    queryKey: qk.yayasan.locations.list({ providerId }),
    queryFn: () => api.getLocations(providerId),
    enabled: !!providerId,
    select: res => res.data,
  });
  const locationIds = locations.map(l => l.id);

  const { data: affiliations = [], isPending: loadingAffiliationsQuery } = useQuery({
    queryKey: qk.yayasan.therapists.list({ locationIds: locationIds.join(',') }),
    queryFn: async () => {
      const allAff = await Promise.all(
        locationIds.map(id => api.getLocationTherapists(id).catch(() => [] as Affiliation[]))
      );
      return allAff.flat();
    },
    enabled: !!providerId && !loadingLocationsQuery,
  });

  const loading = loadingMe || (!!providerId && (loadingLocationsQuery || loadingAffiliationsQuery));

  // Lokasi pertama jadi pilihan awal sampai pengguna memilih sendiri.
  const inviteLocationId = selectedInviteLocationId || locations[0]?.id || '';
  const createLocationId = createForm.location_id || locations[0]?.id || '';

  const { mutate: createTherapist, isPending: creating } = useMutation({
    mutationFn: (body: { full_name: string; email: string; password: string; location_id: string }) =>
      api.createTherapist(body),
    onSuccess: (res) => {
      setCreated(res);
      setShowCreate(false);
      setCreateForm({ full_name: '', email: '', password: '', location_id: '' });
      qc.invalidateQueries({ queryKey: qk.yayasan.therapists.all() });
    },
    onError: (err: unknown) => {
      setCreateError(err instanceof Error ? err.message : 'Gagal membuat akun terapis');
    },
  });

  const { mutate: inviteTherapist, isPending: inviting } = useMutation({
    mutationFn: (body: { location_id: string; therapist_id: string }) => api.inviteTherapist(body),
    onSuccess: () => {
      setInviteTherapistId('');
      setShowInvite(false);
      qc.invalidateQueries({ queryKey: qk.yayasan.therapists.all() });
    },
    onError: (err: unknown) => {
      setInviteError(err instanceof Error ? err.message : 'Gagal mengirim undangan');
    },
  });

  const { mutate: removeAffiliation, isPending: removing, variables: removingVars } = useMutation({
    mutationFn: (id: string) => api.removeAffiliation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.yayasan.therapists.all() }),
    onError: () => alert('Gagal menghapus afiliasi'),
  });
  const removingId = removing ? removingVars ?? null : null;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const { full_name, email, password } = createForm;
    if (!full_name.trim() || !email.trim() || !createLocationId) {
      setCreateError('Lengkapi semua field.');
      return;
    }
    // Aturan password sama dengan pendaftaran publik dan dengan backend —
    // akun terapis yang dibuat yayasan tidak boleh lebih lemah.
    const pwResult = validatePassword(password);
    if (!pwResult.valid) {
      setCreateError(`Password harus ${pwResult.errors.map((e) => e.toLowerCase()).join(', ')}.`);
      return;
    }
    setCreateError('');
    createTherapist({
      full_name: full_name.trim(), email: email.trim(), password, location_id: createLocationId,
    });
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteLocationId || !inviteTherapistId.trim()) return;
    setInviteError('');
    inviteTherapist({ location_id: inviteLocationId, therapist_id: inviteTherapistId.trim() });
  }

  function handleRemove(id: string) {
    if (!confirm('Hapus afiliasi ini?')) return;
    removeAffiliation(id);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Terapis</h1>
          <p className="text-slate-400 text-sm">Kelola terapis yang bergabung di yayasan Anda</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowCreate(true); setCreateError(''); setCreated(null); }}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Buat Terapis
          </button>
          <button onClick={() => { setShowInvite(true); setInviteError(''); }}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <UserPlus className="w-4 h-4" /> Undang Terapis
          </button>
        </div>
      </div>

      {created && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-300 mb-1">Akun terapis berhasil dibuat</p>
              <p className="text-xs text-slate-400 mb-3">Catat & serahkan kredensial ini ke terapis — kata sandi tidak akan ditampilkan lagi.</p>
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 font-mono space-y-1">
                <div>Nama: {created.full_name}</div>
                <div>Email: {created.email}</div>
                <div>Kata sandi: {created.password}</div>
              </div>
              <button onClick={() => {
                navigator.clipboard?.writeText(`Email: ${created.email}\nKata sandi: ${created.password}`);
                setCopied(true); setTimeout(() => setCopied(false), 2000);
              }} className="mt-3 flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Tersalin' : 'Salin kredensial'}
              </button>
            </div>
            <button onClick={() => setCreated(null)} className="text-slate-500 hover:text-white text-xs">Tutup</button>
          </div>
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-teal-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-1">Buat Akun Terapis</h2>
          <p className="text-xs text-slate-400 mb-4">Akun terapis langsung aktif & terafiliasi ke lokasi yang dipilih.</p>
          {createError && <p className="text-red-400 text-xs mb-4 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{createError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Nama lengkap *</label>
              <input value={createForm.full_name} onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Nama terapis"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Lokasi *</label>
              <div className="relative">
                <select value={createLocationId} onChange={e => setCreateForm(f => ({ ...f, location_id: e.target.value }))}
                  className="w-full appearance-none bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 pr-8">
                  {locations.length === 0
                    ? <option value="">Belum ada lokasi — tambah lokasi dulu</option>
                    : locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email *</label>
              <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@terapis.com"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Kata sandi awal *</label>
              <input value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 karakter, huruf besar, angka, simbol"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={creating}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {creating ? 'Membuat...' : 'Buat Akun'}
            </button>
            <button type="button" onClick={() => { setShowCreate(false); setCreateError(''); }}
              className="bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Batal</button>
          </div>
        </form>
      )}

      {showInvite && (
        <form onSubmit={handleInvite} className="bg-slate-900 border border-indigo-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-1">Undang Terapis</h2>
          <p className="text-xs text-slate-400 mb-4">Masukkan ID akun terapis yang terdaftar di platform.</p>
          {inviteError && <p className="text-red-400 text-xs mb-4 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{inviteError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Lokasi</label>
              <div className="relative">
                <select value={inviteLocationId} onChange={e => setSelectedInviteLocationId(e.target.value)}
                  className="w-full appearance-none bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 pr-8">
                  {locations.length === 0
                    ? <option value="">Belum ada lokasi — tambah lokasi dulu</option>
                    : locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)
                  }
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">ID Akun Terapis</label>
              <input value={inviteTherapistId} onChange={e => setInviteTherapistId(e.target.value)}
                placeholder="UUID akun terapis..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono" />
              <p className="text-xs text-slate-600 mt-1">Minta terapis membagikan ID akun dari halaman profil mereka.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={inviting || !inviteLocationId || !inviteTherapistId.trim()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              {inviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {inviting ? 'Mengirim...' : 'Kirim Undangan'}
            </button>
            <button type="button" onClick={() => { setShowInvite(false); setInviteTherapistId(''); setInviteError(''); }}
              className="bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
              Batal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : affiliations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-slate-400 text-sm">Belum ada terapis terdaftar.</p>
          <p className="text-slate-500 text-xs mt-1">Undang terapis untuk bergabung di lokasi Anda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {affiliations.map(aff => (
            <div key={aff.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-600/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">{aff.therapist_name ?? 'Terapis'}</p>
                      <span className={`text-xs border px-2 py-0.5 rounded-full ${statusColor[aff.status] ?? statusColor.inactive}`}>
                        {statusLabel[aff.status] ?? aff.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{aff.therapist_email}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{aff.location_name}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRemove(aff.id)} disabled={removingId === aff.id}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 bg-slate-800 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                  {removingId === aff.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

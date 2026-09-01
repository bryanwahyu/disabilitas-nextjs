import { createFileRoute } from '@tanstack/react-router';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Users, Calendar, Tag, Loader2 } from 'lucide-react';
import { api } from '@/lib/yayasan/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-yayasan/dashboard/pelatihan/')({
  component: PelatihanPage,
});


const emptyForm = {
  title: '', category: 'lainnya', training_type: 'online',
  start_date: '', max_participants: '', description: '',
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  published: { label: 'Aktif', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  pending: { label: 'Menunggu Review', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  rejected: { label: 'Ditolak', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  draft: { label: 'Draft', cls: 'bg-slate-700 text-slate-400 border-slate-600' },
};
function statusMeta(s: string) {
  return STATUS_META[s] ?? STATUS_META.draft;
}

function PelatihanPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const { data: trainings = [], isPending: loading } = useQuery({
    queryKey: qk.yayasan.trainings.list(),
    queryFn: () => api.getMyTrainings(),
    select: res => res.data,
  });

  const { mutate: submitForReview, isPending: submitting, variables: submittingVars } = useMutation({
    mutationFn: (id: string) => api.submitTraining(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.yayasan.trainings.all() }),
    // Gagal ajukan didiamkan; status tetap seperti semula.
    onError: () => {},
  });
  const submittingId = submitting ? submittingVars ?? null : null;

  function handleSubmitForReview(id: string) {
    submitForReview(id);
  }

  const { mutate: createTraining, isPending: saving } = useMutation({
    mutationFn: async (input: typeof emptyForm) => {
      const me = await qc.ensureQueryData({ queryKey: qk.me(), queryFn: () => api.getMe() });
      return api.createTraining({
        title: input.title,
        description: input.description || input.title,
        organizer_name: me.Profile?.FullName ?? me.Email,
        category: input.category,
        training_type: input.training_type,
        start_date: new Date(input.start_date).toISOString(),
        max_participants: input.max_participants ? parseInt(input.max_participants) : undefined,
        is_free: true,
        price: 0,
        skill_level: 'semua',
        status: 'draft',
      });
    },
    onSuccess: () => {
      setForm(emptyForm);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: qk.yayasan.trainings.all() });
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Gagal membuat pelatihan');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.start_date) return;
    setError('');
    createTraining(form);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Pelatihan</h1>
          <p className="text-slate-400 text-sm">Buat dan kelola program pelatihan yayasan Anda</p>
        </div>
        <button onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Buat Pelatihan
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">Pelatihan Baru</h2>
          {error && <p className="text-red-400 text-xs mb-4 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Judul *</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Workshop ..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Kategori</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                {['soft_skill','hard_skill','sertifikasi','bahasa','teknologi','lainnya'].map(c =>
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Tipe</label>
              <select value={form.training_type} onChange={e => setForm(p => ({ ...p, training_type: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Tanggal Mulai *</label>
              <input required type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Kapasitas</label>
              <input type="number" min="1" value={form.max_participants} onChange={e => setForm(p => ({ ...p, max_participants: e.target.value }))}
                placeholder="Kosongkan jika tidak terbatas"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Deskripsi Singkat</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Tentang pelatihan ini..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan Draft'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setError(''); }}
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
      ) : trainings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-slate-400 text-sm">Belum ada pelatihan. Buat program pertama Anda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trainings.map(t => {
            const regCount = 0;
            const maxCount = t.max_participants ?? 0;
            const pct = maxCount > 0 ? Math.min((regCount / maxCount) * 100, 100) : 0;
            return (
              <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-white">{t.title}</p>
                        <span className={`text-xs border px-2 py-0.5 rounded-full ${statusMeta(t.status).cls}`}>
                          {statusMeta(t.status).label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                          {new Date(t.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {maxCount > 0 && (
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{regCount}/{maxCount} peserta</span>
                        )}
                        <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{t.category}</span>
                      </div>
                      {t.status === 'rejected' && t.reject_reason && (
                        <p className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
                          Alasan ditolak: {t.reject_reason}
                        </p>
                      )}
                      {maxCount > 0 && (
                        <div className="mt-2 w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                  {(t.status === 'draft' || t.status === 'rejected') && (
                    <button onClick={() => handleSubmitForReview(t.id)} disabled={submittingId === t.id}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-medium px-3 py-2 rounded-lg flex-shrink-0">
                      {submittingId === t.id && <Loader2 className="w-3 h-3 animate-spin" />}
                      Ajukan tayang
                    </button>
                  )}
                  {t.status === 'pending' && (
                    <span className="text-xs text-amber-400 flex-shrink-0">Menunggu persetujuan admin</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

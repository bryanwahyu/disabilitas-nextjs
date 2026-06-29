'use client';

import { useEffect, useState } from 'react';
import { PartyPopper, Plus, Calendar, MapPin, Loader2 } from 'lucide-react';
import { api, EventRequest } from '@/lib/yayasan/api';

const statusColor: Record<string, string> = {
  pending:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};
const statusLabel: Record<string, string> = {
  pending: 'Menunggu Review', approved: 'Disetujui', rejected: 'Ditolak',
};

const emptyForm = { title: '', mode: 'offline', start_at: '', end_at: '', location: '' };

export default function AcaraPage() {
  const [events, setEvents] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getEventRequests()
      .then(res => setEvents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.start_at || !form.end_at) return;
    setSaving(true);
    setError('');
    try {
      const created = await api.createEventRequest({
        title: form.title,
        mode: form.mode,
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        location: form.location || undefined,
      });
      setEvents(prev => [created, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat acara');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Acara</h1>
          <p className="text-slate-400 text-sm">Ajukan dan kelola acara publik yayasan Anda</p>
        </div>
        <button onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Ajukan Acara
        </button>
      </div>

      <div className="bg-slate-900 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-amber-400">
        Acara yang diajukan akan direview admin sebelum dipublikasikan ke platform.
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">Pengajuan Acara Baru</h2>
          {error && <p className="text-red-400 text-xs mb-4 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Nama Acara *</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Seminar / Workshop ..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Mode</label>
              <select value={form.mode} onChange={e => setForm(p => ({ ...p, mode: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                <option value="offline">Offline</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Lokasi / Link</label>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                placeholder="Alamat atau URL meeting"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Tanggal Mulai *</label>
              <input required type="datetime-local" value={form.start_at} onChange={e => setForm(p => ({ ...p, start_at: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Tanggal Selesai *</label>
              <input required type="datetime-local" value={form.end_at} onChange={e => setForm(p => ({ ...p, end_at: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Mengirim...' : 'Kirim Pengajuan'}
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
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PartyPopper className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-slate-400 text-sm">Belum ada pengajuan acara.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(ev => (
            <div key={ev.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                  <PartyPopper className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{ev.title}</p>
                    <span className={`text-xs border px-2 py-0.5 rounded-full ${statusColor[ev.status] ?? statusColor.pending}`}>
                      {statusLabel[ev.status] ?? ev.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                      {new Date(ev.start_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>}
                    <span className="capitalize">{ev.mode}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

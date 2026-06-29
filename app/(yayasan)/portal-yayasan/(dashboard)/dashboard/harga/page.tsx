'use client';

import { useEffect, useState } from 'react';
import { Tag, Plus, Loader2, CheckCircle2, Clock, XCircle, Pencil } from 'lucide-react';
import { api, PriceItem, PriceItemType, Location, Training } from '@/lib/yayasan/api';

const rupiah = (n?: number | null) =>
  typeof n === 'number' ? 'Rp ' + n.toLocaleString('id-ID') : '—';

const STATUS: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
  pending: { label: 'Menunggu Review', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30', Icon: Clock },
  approved: { label: 'Disetujui', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', Icon: CheckCircle2 },
  rejected: { label: 'Ditolak', cls: 'bg-red-500/15 text-red-300 border-red-500/30', Icon: XCircle },
};

export default function HargaPage() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const [form, setForm] = useState<{ item_type: PriceItemType; item_ref_id: string; harga_dasar: string }>({
    item_type: 'therapy_service', item_ref_id: '', harga_dasar: '',
  });

  async function load() {
    try {
      const me = await api.getMe();
      const [pr, loc, tr] = await Promise.all([
        api.getPrices().catch(() => []),
        api.getLocations(me.ID).then(r => r.data).catch(() => []),
        api.getMyTrainings().then(r => r.data).catch(() => []),
      ]);
      setPrices(pr ?? []);
      setLocations(loc ?? []);
      setTrainings(tr ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const options = form.item_type === 'therapy_service'
    ? locations.map(l => ({ id: l.id, name: l.name }))
    : trainings.map(t => ({ id: t.id, name: t.title }));

  const refName = (p: PriceItem) =>
    (p.item_type === 'therapy_service'
      ? locations.find(l => l.id === p.item_ref_id)?.name
      : trainings.find(t => t.id === p.item_ref_id)?.title) ?? p.item_ref_id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const harga = parseInt(form.harga_dasar, 10);
    if (!form.item_ref_id || !harga || harga <= 0) { setError('Pilih item dan isi harga dasar (> 0)'); return; }
    setSaving(true); setError('');
    try {
      const created = await api.createPrice({ item_type: form.item_type, item_ref_id: form.item_ref_id, harga_dasar: harga });
      setPrices(prev => [created, ...prev]);
      setForm({ item_type: 'therapy_service', item_ref_id: '', harga_dasar: '' });
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengajukan harga');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    const harga = parseInt(editVal, 10);
    if (!harga || harga <= 0) return;
    try {
      const updated = await api.updatePrice(id, harga);
      setPrices(prev => prev.map(p => (p.id === id ? updated : p)));
      setEditId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui harga');
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Harga Layanan</h1>
          <p className="text-slate-400 text-sm">
            Ajukan harga dasar layanan & pelatihan. Admin meninjau dan menetapkan harga jual; selisihnya menjadi komisi platform.
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Ajukan Harga
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-2">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Jenis</label>
              <select value={form.item_type}
                onChange={e => setForm(f => ({ ...f, item_type: e.target.value as PriceItemType, item_ref_id: '' }))}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                <option value="therapy_service">Layanan Terapi</option>
                <option value="training">Pelatihan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Item</label>
              <select value={form.item_ref_id}
                onChange={e => setForm(f => ({ ...f, item_ref_id: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                <option value="">— pilih —</option>
                {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Harga Dasar (Rp)</label>
              <input type="number" min={1} value={form.harga_dasar}
                onChange={e => setForm(f => ({ ...f, harga_dasar: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" placeholder="200000" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Ajukan
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-white text-sm px-4 py-2">Batal</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Memuat…
        </div>
      ) : prices.length === 0 ? (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-12 text-center">
          <Tag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Belum ada harga diajukan.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-slate-900 border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800">
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Jenis</th>
                <th className="px-4 py-3 font-medium">Harga Dasar</th>
                <th className="px-4 py-3 font-medium">Harga Jual</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {prices.map(p => {
                const s = STATUS[p.status] ?? STATUS.pending;
                const editable = p.status === 'pending' || p.status === 'rejected';
                return (
                  <tr key={p.id} className="border-b border-slate-800/60 last:border-0">
                    <td className="px-4 py-3 text-white">{refName(p)}</td>
                    <td className="px-4 py-3 text-slate-400">{p.item_type === 'therapy_service' ? 'Layanan' : 'Pelatihan'}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {editId === p.id ? (
                        <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                          className="w-28 bg-slate-800 border border-slate-700 text-white rounded px-2 py-1" />
                      ) : rupiah(p.harga_dasar)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{rupiah(p.harga_jual)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${s.cls}`}>
                        <s.Icon className="w-3 h-3" /> {s.label}
                      </span>
                      {p.status === 'rejected' && p.admin_note && (
                        <p className="text-xs text-red-300/70 mt-1">{p.admin_note}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editable && (editId === p.id ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => saveEdit(p.id)} className="text-emerald-300 hover:text-emerald-200 text-xs">Simpan</button>
                          <button onClick={() => setEditId(null)} className="text-slate-500 hover:text-slate-300 text-xs">Batal</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditId(p.id); setEditVal(String(p.harga_dasar)); }}
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-xs">
                          <Pencil className="w-3 h-3" /> Ubah
                        </button>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

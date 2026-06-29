'use client';

import { useEffect, useState } from 'react';
import { MapPin, Plus, Phone, Trash2, Loader2, Stethoscope, X } from 'lucide-react';
import { api, Location, MeUser, SERVICE_MODES, SERVICE_MODE_LABEL } from '@/lib/yayasan/api';

const typeLabel: Record<string, string> = {
  yayasan: 'Yayasan', klinik: 'Klinik', rumah_sakit: 'Rumah Sakit',
  praktek_mandiri: 'Praktek Mandiri', puskesmas: 'Puskesmas', lainnya: 'Lainnya',
};

const emptyForm = {
  name: '', type: 'klinik', address: '', phone: '', description: '',
  services: '' as string, modes: [] as string[],
};

export default function LokasiPage() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Editor terapi & mode per lokasi
  const [editId, setEditId] = useState<string | null>(null);
  const [editServices, setEditServices] = useState<string[]>([]);
  const [editModes, setEditModes] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
  const [savingLoc, setSavingLoc] = useState(false);

  function openEditor(loc: Location) {
    setEditId(loc.id);
    setEditServices(loc.services ?? []);
    setEditModes(loc.consultation_methods ? loc.consultation_methods.split(',').filter(Boolean) : []);
    setNewService('');
  }

  function toggleEditMode(m: string) {
    setEditModes(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  function addService() {
    const s = newService.trim();
    if (s && !editServices.includes(s)) setEditServices(prev => [...prev, s]);
    setNewService('');
  }

  async function saveEditor(locId: string) {
    setSavingLoc(true);
    try {
      const updated = await api.updateLocation(locId, {
        services: editServices,
        consultation_methods: editModes,
      });
      setLocations(prev => prev.map(l => (l.id === locId ? { ...l, ...updated } : l)));
      setEditId(null);
    } catch {
      alert('Gagal menyimpan terapi/mode');
    } finally {
      setSavingLoc(false);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const user = await api.getMe();
        setMe(user);
        const res = await api.getLocations(user.ID);
        setLocations(res.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.address) return;
    setSaving(true);
    setError('');
    try {
      const serviceList = form.services.split(',').map(s => s.trim()).filter(Boolean);
      const created = await api.createLocation({
        name: form.name,
        type: form.type,
        address: form.address,
        phone: form.phone || undefined,
        description: form.description || undefined,
        services: serviceList,
        consultation_methods: form.modes,
      });
      setLocations(prev => [created, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan lokasi');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus lokasi ini?')) return;
    setDeletingId(id);
    try {
      await api.deleteLocation(id);
      setLocations(prev => prev.filter(l => l.id !== id));
    } catch {
      alert('Gagal menghapus lokasi');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Lokasi Pratik</h1>
          <p className="text-slate-400 text-sm">Kelola semua lokasi yang bernaung di yayasan Anda</p>
        </div>
        <button onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Tambah Lokasi
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">Tambah Lokasi Baru</h2>
          {error && <p className="text-red-400 text-xs mb-4 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Nama Lokasi *</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Klinik / Yayasan ..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Tipe</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                {Object.entries(typeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Alamat *</label>
              <input required value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                placeholder="Jl. ..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Nomor Telepon</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="021-..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Deskripsi</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="Deskripsi singkat lokasi..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Terapi yang tersedia</label>
              <input value={form.services} onChange={e => setForm(p => ({ ...p, services: e.target.value }))}
                placeholder="Pisahkan dengan koma: Fisioterapi, Terapi Wicara, Okupasi Terapi"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Mode layanan</label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_MODES.map(m => {
                  const active = form.modes.includes(m.value);
                  return (
                    <button type="button" key={m.value}
                      onClick={() => setForm(p => ({ ...p, modes: active ? p.modes.filter(x => x !== m.value) : [...p.modes, m.value] }))}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${active ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan Lokasi'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setError(''); }}
              className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Batal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : locations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MapPin className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-slate-400 text-sm">Belum ada lokasi. Tambahkan lokasi pertama Anda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map(loc => (
            <div key={loc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">{loc.name}</p>
                      {loc.type && <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{typeLabel[loc.type] ?? loc.type}</span>}
                      {loc.is_verified && <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Terverifikasi</span>}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{loc.address}</p>
                    {loc.phone && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{loc.phone}</p>}
                    {loc.services && loc.services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {loc.services.map(s => (
                          <span key={s} className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                    {loc.consultation_methods && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {loc.consultation_methods.split(',').filter(Boolean).map(m => (
                          <span key={m} className="text-xs bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Stethoscope className="w-3 h-3" />{SERVICE_MODE_LABEL[m] ?? m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => editId === loc.id ? setEditId(null) : openEditor(loc)}
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors">
                    <Stethoscope className="w-3 h-3" /> Kelola terapi & mode
                  </button>
                  <button onClick={() => handleDelete(loc.id)} disabled={deletingId === loc.id}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 bg-slate-800 px-3 py-1.5 rounded-lg transition-colors">
                    {deletingId === loc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Hapus
                  </button>
                </div>
              </div>

              {editId === loc.id && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Terapi yang tersedia</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editServices.map(s => (
                        <span key={s} className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                          {s}
                          <button type="button" onClick={() => setEditServices(prev => prev.filter(x => x !== s))} className="hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {editServices.length === 0 && <span className="text-xs text-slate-600">Belum ada terapi.</span>}
                    </div>
                    <div className="flex gap-2">
                      <input value={newService} onChange={e => setNewService(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addService(); } }}
                        placeholder="Nama terapi, mis. Fisioterapi"
                        className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                      <button type="button" onClick={addService}
                        className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-3 py-2 rounded-lg flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Tambah</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Mode layanan</label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICE_MODES.map(m => {
                        const active = editModes.includes(m.value);
                        return (
                          <button type="button" key={m.value} onClick={() => toggleEditMode(m.value)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${active ? 'bg-teal-600 border-teal-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => saveEditor(loc.id)} disabled={savingLoc}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
                      {savingLoc && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {savingLoc ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button onClick={() => setEditId(null)} className="bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Batal</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

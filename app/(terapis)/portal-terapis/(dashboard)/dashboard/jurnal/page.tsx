'use client';

import { useEffect, useState } from 'react';
import { NotebookPen, Loader2, Calendar, CheckCircle2, Star } from 'lucide-react';
import { api, ApiError, Appointment, Child, SessionNoteInput } from '@/lib/terapis/api';

function fmtDate(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

const emptyForm: SessionNoteInput = {
  child_id: '', activity: '', observation: '', progress_rating: 3, notes: '',
};

export default function JurnalPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [form, setForm] = useState<SessionNoteInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.getAppointments()
      .then(res => setAppointments(res.data.filter(a => a.Status !== 'cancelled')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function openForm(appt: Appointment) {
    setOpenId(appt.ID);
    setForm({ ...emptyForm, session_date: appt.StartAt.slice(0, 10) });
    setError('');
    setChildren([]);
    setLoadingChildren(true);
    try {
      const list = await api.getAppointmentChildren(appt.ID);
      setChildren(list);
      if (list.length > 0) setForm(p => ({ ...p, child_id: list[0].id }));
    } catch {
      setError('Gagal memuat data anak untuk sesi ini.');
    } finally {
      setLoadingChildren(false);
    }
  }

  async function handleSubmit(e: React.FormEvent, apptId: string) {
    e.preventDefault();
    if (!form.child_id || !form.activity.trim()) {
      setError('Pilih anak dan isi aktivitas sesi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.createSessionNote(apptId, {
        ...form,
        observation: form.observation?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });
      await api.completeAppointment(apptId);
      setOpenId(null);
      setForm(emptyForm);
      load();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === 'JOURNAL_REQUIRED') {
        setError('Jurnal wajib diisi sebelum sesi ditandai selesai.');
      } else {
        setError(err instanceof Error ? err.message : 'Gagal menyimpan jurnal.');
      }
    } finally {
      setSaving(false);
    }
  }

  const pending = appointments.filter(a => a.Status !== 'completed');
  const completed = appointments.filter(a => a.Status === 'completed');

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Jurnal Sesi</h1>
        <p className="text-slate-400 text-sm">
          Isi catatan setiap sesi sebelum menandainya selesai. Catatan ini wajib dan akan dilihat orang tua.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Perlu jurnal ({pending.length})</h2>
          {pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-900/50 border border-slate-800 rounded-xl mb-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-600/60 mb-2" />
              <p className="text-slate-400 text-sm">Semua sesi sudah dijurnal. Mantap!</p>
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              {pending.map(appt => (
                <div key={appt.ID} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-600/20 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{fmtDate(appt.StartAt)}</p>
                        <p className="text-xs text-slate-500">{fmtTime(appt.StartAt)} – {fmtTime(appt.EndAt)} · {appt.Status}</p>
                      </div>
                    </div>
                    {openId !== appt.ID && (
                      <button onClick={() => openForm(appt)}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                        <NotebookPen className="w-4 h-4" /> Isi Jurnal & Selesaikan
                      </button>
                    )}
                  </div>

                  {openId === appt.ID && (
                    <form onSubmit={e => handleSubmit(e, appt.ID)} className="mt-4 pt-4 border-t border-slate-800">
                      {error && <p className="text-red-400 text-xs mb-3 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
                      {loadingChildren ? (
                        <div className="flex items-center gap-2 text-slate-500 text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Memuat data anak…</div>
                      ) : children.length === 0 ? (
                        <p className="text-amber-400 text-xs mb-3">Tidak ada data anak pada sesi ini. Orang tua perlu menambah profil anak saat membuat janji.</p>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Anak *</label>
                            <select value={form.child_id} onChange={e => setForm(p => ({ ...p, child_id: e.target.value }))}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500">
                              {children.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Aktivitas sesi *</label>
                            <textarea required value={form.activity} onChange={e => setForm(p => ({ ...p, activity: e.target.value }))}
                              rows={2} placeholder="Apa yang dilakukan dalam sesi ini…"
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Observasi / respons anak</label>
                            <textarea value={form.observation} onChange={e => setForm(p => ({ ...p, observation: e.target.value }))}
                              rows={2} placeholder="Bagaimana anak merespons…"
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Tingkat perkembangan</label>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4, 5].map(n => (
                                <button type="button" key={n} onClick={() => setForm(p => ({ ...p, progress_rating: n }))}
                                  className={`p-1.5 rounded-lg border ${form.progress_rating >= n ? 'border-amber-500/40 bg-amber-500/10' : 'border-slate-700 bg-slate-800'}`}>
                                  <Star className={`w-4 h-4 ${form.progress_rating >= n ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Pesan untuk orang tua</label>
                            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                              rows={2} placeholder="Catatan / saran untuk di rumah…"
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
                          </div>
                          <div className="flex gap-3">
                            <button type="submit" disabled={saving}
                              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
                              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              {saving ? 'Menyimpan…' : 'Simpan & Tandai Selesai'}
                            </button>
                            <button type="button" onClick={() => { setOpenId(null); setError(''); }}
                              className="bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Batal</button>
                          </div>
                        </div>
                      )}
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}

          <h2 className="text-sm font-semibold text-slate-300 mb-3">Sesi selesai ({completed.length})</h2>
          {completed.length === 0 ? (
            <p className="text-slate-500 text-sm">Belum ada sesi yang diselesaikan.</p>
          ) : (
            <div className="space-y-2">
              {completed.map(appt => (
                <div key={appt.ID} className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{fmtDate(appt.StartAt)}</span>
                  <span className="text-xs text-slate-500">{fmtTime(appt.StartAt)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

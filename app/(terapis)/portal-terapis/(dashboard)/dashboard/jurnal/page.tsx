'use client';

import { useEffect, useState } from 'react';
import { Loader2, Star, Sparkles, MessageCircle, CheckCircle2 } from 'lucide-react';
import { api, ApiError, Appointment, Child, SessionNoteInput, SessionNoteFeedItem } from '@/lib/terapis/api';

function fmtDate(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
// Waktu relatif gaya X: "baru saja", "3j", "2h", lalu tanggal.
function relTime(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}h`;
  return fmtDate(s);
}
function initials(name?: string) {
  if (!name) return 'T';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'T';
}

const emptyForm: SessionNoteInput = {
  child_id: '', activity: '', observation: '', progress_rating: 3, notes: '',
};

function RatingBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`w-3.5 h-3.5 ${value >= n ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
      ))}
    </span>
  );
}

export default function JurnalPage() {
  const [me, setMe] = useState<{ name: string }>({ name: '' });
  const [pending, setPending] = useState<Appointment[]>([]);
  const [feed, setFeed] = useState<SessionNoteFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer
  const [selectedApptId, setSelectedApptId] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [form, setForm] = useState<SessionNoteInput>(emptyForm);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadAll() {
    setLoading(true);
    try {
      const [meRes, apptRes, feedRes] = await Promise.all([
        api.getMe().catch(() => null),
        api.getAppointments().catch(() => ({ data: [] as Appointment[], meta: { total: 0 } })),
        api.getMySessionNotes().catch(() => ({ data: [] as SessionNoteFeedItem[], meta: { total: 0 } })),
      ]);
      if (meRes) setMe({ name: meRes.Profile?.FullName ?? meRes.Email ?? 'Terapis' });
      setPending(apptRes.data.filter(a => a.Status !== 'completed' && a.Status !== 'cancelled'));
      setFeed(feedRes.data);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadAll(); }, []);

  async function selectSession(apptId: string) {
    setSelectedApptId(apptId);
    setError('');
    setExpanded(!!apptId);
    if (!apptId) return;
    const appt = pending.find(a => a.ID === apptId);
    setForm({ ...emptyForm, session_date: appt?.StartAt.slice(0, 10) });
    setChildren([]);
    setLoadingChildren(true);
    try {
      const list = await api.getAppointmentChildren(apptId);
      setChildren(list);
      if (list.length > 0) setForm(p => ({ ...p, child_id: list[0].id }));
    } catch {
      setError('Gagal memuat data anak untuk sesi ini.');
    } finally {
      setLoadingChildren(false);
    }
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!form.child_id || !form.activity.trim()) {
      setError('Pilih anak dan isi aktivitas sesi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.createSessionNote(selectedApptId, {
        ...form,
        observation: form.observation?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });
      await api.completeAppointment(selectedApptId);
      setSelectedApptId('');
      setExpanded(false);
      setForm(emptyForm);
      await loadAll();
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-6 pt-8 pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">Jurnal Sesi</h1>
        <p className="text-slate-500 text-xs mt-0.5">Catatan tiap sesi — wajib diisi sebelum sesi selesai, dan dilihat orang tua.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* ---- Composer (gaya X) ---- */}
          <div className="border-b border-slate-800 px-6 py-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-600/20 text-teal-300 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {initials(me.name)}
              </div>
              <div className="flex-1 min-w-0">
                {pending.length === 0 ? (
                  <p className="text-slate-500 text-sm py-2">Tidak ada sesi yang perlu dijurnal. 🎉</p>
                ) : (
                  <form onSubmit={handlePost}>
                    <select
                      value={selectedApptId}
                      onChange={e => selectSession(e.target.value)}
                      className="w-full bg-transparent text-white text-base outline-none mb-2 cursor-pointer"
                    >
                      <option value="" className="bg-slate-900">Apa progres sesi ini? Pilih sesi…</option>
                      {pending.map(a => (
                        <option key={a.ID} value={a.ID} className="bg-slate-900">
                          {fmtDate(a.StartAt)} · {fmtTime(a.StartAt)}–{fmtTime(a.EndAt)}
                        </option>
                      ))}
                    </select>

                    {expanded && (
                      <div className="space-y-3 pt-2">
                        {loadingChildren ? (
                          <div className="flex items-center gap-2 text-slate-500 text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" /> Memuat data anak…</div>
                        ) : children.length === 0 ? (
                          <p className="text-amber-400 text-xs">Tidak ada data anak pada sesi ini.</p>
                        ) : (
                          <>
                            <select value={form.child_id} onChange={e => setForm(p => ({ ...p, child_id: e.target.value }))}
                              className="bg-slate-800 border border-slate-700 text-white rounded-full px-3 py-1 text-xs focus:outline-none focus:border-teal-500">
                              {children.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                            </select>
                            <textarea required value={form.activity} onChange={e => setForm(p => ({ ...p, activity: e.target.value }))}
                              rows={2} placeholder="Apa yang dilakukan dalam sesi ini…"
                              className="w-full bg-transparent text-white text-base placeholder:text-slate-600 resize-none outline-none border-b border-slate-800 focus:border-teal-600 pb-2" />
                            <textarea value={form.observation ?? ''} onChange={e => setForm(p => ({ ...p, observation: e.target.value }))}
                              rows={2} placeholder="Observasi / respons anak (opsional)…"
                              className="w-full bg-transparent text-slate-200 text-sm placeholder:text-slate-600 resize-none outline-none" />
                            <textarea value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                              rows={2} placeholder="Pesan untuk orang tua (opsional)…"
                              className="w-full bg-transparent text-slate-200 text-sm placeholder:text-slate-600 resize-none outline-none" />
                          </>
                        )}

                        {error && <p className="text-red-400 text-xs">{error}</p>}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500">Perkembangan</span>
                            {[1, 2, 3, 4, 5].map(n => (
                              <button type="button" key={n} onClick={() => setForm(p => ({ ...p, progress_rating: n }))} aria-label={`rating ${n}`}>
                                <Star className={`w-4 h-4 ${form.progress_rating >= n ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                              </button>
                            ))}
                          </div>
                          <button type="submit" disabled={saving || children.length === 0}
                            className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold rounded-full px-5 py-1.5">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Posting
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* ---- Feed ---- */}
          {feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="w-10 h-10 text-slate-700 mb-2" />
              <p className="text-slate-500 text-sm">Belum ada jurnal. Catatan sesi akan muncul di sini.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {feed.map(n => (
                <article key={n.id} className="px-6 py-4 hover:bg-slate-900/40 transition-colors">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {initials(n.child_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-sm flex-wrap">
                        <span className="font-semibold text-white truncate">{n.child_name || 'Anak'}</span>
                        <span className="text-slate-500">· sesi {fmtDate(n.session_date)}</span>
                        <span className="text-slate-600">· {relTime(n.created_at)}</span>
                        <span className="ml-auto"><RatingBadge value={n.progress_rating} /></span>
                      </div>
                      <p className="text-slate-100 text-sm mt-1 whitespace-pre-wrap break-words">{n.activity}</p>
                      {n.observation && <p className="text-slate-400 text-sm mt-1.5 whitespace-pre-wrap break-words">{n.observation}</p>}
                      {n.notes && (
                        <div className="mt-2 flex items-start gap-2 bg-slate-800/50 border border-slate-800 rounded-xl px-3 py-2">
                          <MessageCircle className="w-3.5 h-3.5 text-teal-400 mt-0.5 flex-shrink-0" />
                          <p className="text-slate-300 text-xs whitespace-pre-wrap break-words">{n.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

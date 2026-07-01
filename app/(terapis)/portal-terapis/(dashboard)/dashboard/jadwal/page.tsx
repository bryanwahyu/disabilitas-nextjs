'use client';

import { useEffect, useState } from 'react';
import { Calendar, Loader2, Plus, Trash2, Save, CheckCircle2, Lock } from 'lucide-react';
import { api, ScheduleSlot } from '@/lib/terapis/api';

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const workDays = [1, 2, 3, 4, 5, 6]; // Senin - Sabtu

type DraftSlot = { day_of_week: number; start_time: string; end_time: string };

export default function JadwalPage() {
  const [loading, setLoading] = useState(true);
  const [managed, setManaged] = useState(false);
  const [yayasanName, setYayasanName] = useState('');

  const [slots, setSlots] = useState<DraftSlot[]>([]);
  const [readonlySlots, setReadonlySlots] = useState<ScheduleSlot[]>([]);
  const [duration, setDuration] = useState(60);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      // Terapis milik yayasan (afiliasi aktif) → jadwal diatur yayasan, read-only.
      try {
        const affs = await api.getMyAffiliations();
        const active = (affs ?? []).find(a => a.status === 'active');
        if (active) {
          setManaged(true);
          setYayasanName(active.location_name);
        }
      } catch {
        // tanpa afiliasi → independen
      }

      try {
        const res = await api.getSchedule();
        setHasSchedule(true);
        setDuration(res.schedule?.slot_duration_minutes ?? 60);
        const active = (res.slots ?? []).filter(s => s.is_active);
        setReadonlySlots(active);
        setSlots(active.map(s => ({ day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time })));
      } catch {
        setHasSchedule(false);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function addSlot(day: number) {
    setSlots(prev => [...prev, { day_of_week: day, start_time: '09:00', end_time: '12:00' }]);
    setSaved(false);
  }
  function updateSlot(idx: number, field: 'start_time' | 'end_time', value: string) {
    setSlots(prev => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
    setSaved(false);
  }
  function removeSlot(idx: number) {
    setSlots(prev => prev.filter((_, i) => i !== idx));
    setSaved(false);
  }

  async function handleSave() {
    setError('');
    if (slots.length === 0) {
      setError('Tambahkan minimal 1 slot, atau hapus jadwal bila Anda tidak praktek.');
      return;
    }
    setSaving(true);
    try {
      const body = { slot_duration_minutes: duration, slots };
      if (hasSchedule) await api.updateSchedule(body);
      else { await api.createSchedule(body); setHasSchedule(true); }
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan jadwal');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!hasSchedule) return;
    setSaving(true);
    setError('');
    try {
      await api.deleteSchedule();
      setHasSchedule(false);
      setSlots([]);
      setSaved(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus jadwal');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Jadwal Praktek</h1>
        <p className="text-slate-400 text-sm">Atur jam praktek mingguan Anda.</p>
      </div>

      {managed ? (
        // ---- Read-only: jadwal diatur yayasan ----
        <>
          <div className="mb-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <Lock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-300">
              Jadwal Anda diatur oleh {yayasanName || 'yayasan/klinik tempat Anda terafiliasi'}.
              Hubungi pengelola untuk perubahan.
            </p>
          </div>
          {readonlySlots.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Yayasan belum mengatur jadwal Anda.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
              {workDays.map(day => {
                const daySlots = readonlySlots.filter(s => s.day_of_week === day);
                return (
                  <div key={day} className="p-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200">{dayNames[day]}</span>
                    {daySlots.length === 0 ? (
                      <span className="text-xs text-slate-600">Libur</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {daySlots.map(s => (
                          <span key={s.id} className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded px-2 py-0.5">
                            {s.start_time}–{s.end_time}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        // ---- Editable: terapis independen ----
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-slate-400">Durasi per slot</label>
            <select
              value={duration}
              onChange={e => { setDuration(Number(e.target.value)); setSaved(false); }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 outline-none"
            >
              {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} menit</option>)}
            </select>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
            {workDays.map(day => {
              const daySlots = slots.map((s, idx) => ({ ...s, idx })).filter(s => s.day_of_week === day);
              return (
                <div key={day} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-200">{dayNames[day]}</span>
                    <button onClick={() => addSlot(day)} className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                      <Plus className="w-3.5 h-3.5" /> Tambah jam
                    </button>
                  </div>
                  {daySlots.length === 0 ? (
                    <p className="text-xs text-slate-600">Libur</p>
                  ) : (
                    <div className="space-y-2">
                      {daySlots.map(s => (
                        <div key={s.idx} className="flex items-center gap-2">
                          <input type="time" value={s.start_time} onChange={e => updateSlot(s.idx, 'start_time', e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500" />
                          <span className="text-slate-500 text-xs">–</span>
                          <input type="time" value={s.end_time} onChange={e => updateSlot(s.idx, 'end_time', e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500" />
                          <button onClick={() => removeSlot(s.idx)} className="text-slate-500 hover:text-red-400 p-1" aria-label="Hapus slot">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
          {saved && (
            <p className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Jadwal tersimpan.
            </p>
          )}

          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan jadwal
            </button>
            {hasSchedule && (
              <button onClick={handleDelete} disabled={saving}
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-red-400 disabled:opacity-50 text-sm rounded-lg px-3 py-2">
                <Trash2 className="w-4 h-4" /> Hapus jadwal
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

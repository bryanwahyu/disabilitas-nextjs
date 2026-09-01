import { createFileRoute } from '@tanstack/react-router';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Loader2, Plus, Trash2, Save, CheckCircle2, Lock } from 'lucide-react';
import { api, ScheduleDetail, ScheduleSaveInput } from '@/lib/terapis/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-terapis/dashboard/jadwal/')({
  component: JadwalPage,
});


const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const workDays = [1, 2, 3, 4, 5, 6]; // Senin - Sabtu

type DraftSlot = { day_of_week: number; start_time: string; end_time: string };

function JadwalPage() {
  const qc = useQueryClient();
  const scheduleKey = qk.terapis.schedule.detail('me');

  // Draft lokal: null = belum disentuh, tampilkan apa adanya dari server.
  const [draftSlots, setDraftSlots] = useState<DraftSlot[] | null>(null);
  const [draftDuration, setDraftDuration] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Terapis milik yayasan (afiliasi aktif) → jadwal diatur yayasan, read-only.
  // Gagal ambil afiliasi = terapis independen, bukan error yang perlu ditampilkan.
  const { data: affiliations, isPending: loadingAffiliations } = useQuery({
    queryKey: qk.terapis.affiliations.list(),
    queryFn: () => api.getMyAffiliations(),
    retry: false,
  });
  const activeAffiliation = (affiliations ?? []).find(a => a.status === 'active');
  const managed = !!activeAffiliation;
  const yayasanName = activeAffiliation?.location_name ?? '';

  // Belum punya jadwal juga datang sebagai error dari backend → petakan ke null
  // supaya halaman masuk mode "buat baru", bukan layar error.
  const { data: schedule, isPending: loadingSchedule } = useQuery({
    queryKey: scheduleKey,
    queryFn: () => api.getSchedule().catch(() => null),
  });

  const hasSchedule = !!schedule;
  const readonlySlots = (schedule?.slots ?? []).filter(s => s.is_active);
  const serverSlots: DraftSlot[] = readonlySlots.map(s => ({
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
  }));
  const slots = draftSlots ?? serverSlots;
  const duration = draftDuration ?? schedule?.schedule?.slot_duration_minutes ?? 60;

  const { mutate: saveSchedule, isPending: savingSchedule } = useMutation({
    mutationFn: (body: ScheduleSaveInput) =>
      hasSchedule ? api.updateSchedule(body) : api.createSchedule(body),
    // Draft sengaja tidak direset: yang tampil tetap persis apa yang disimpan,
    // tanpa bergantung pada bentuk balasan server.
    onSuccess: (res: ScheduleDetail) => {
      qc.setQueryData(scheduleKey, res);
      setSaved(true);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan jadwal');
    },
  });

  const { mutate: deleteSchedule, isPending: deletingSchedule } = useMutation({
    mutationFn: () => api.deleteSchedule(),
    onSuccess: () => {
      qc.setQueryData(scheduleKey, null);
      setDraftSlots([]);
      setDraftDuration(null);
      setSaved(false);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Gagal menghapus jadwal');
    },
  });

  const saving = savingSchedule || deletingSchedule;
  const loading = loadingAffiliations || loadingSchedule;

  function addSlot(day: number) {
    setDraftSlots([...slots, { day_of_week: day, start_time: '09:00', end_time: '12:00' }]);
    setSaved(false);
  }
  function updateSlot(idx: number, field: 'start_time' | 'end_time', value: string) {
    setDraftSlots(slots.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
    setSaved(false);
  }
  function removeSlot(idx: number) {
    setDraftSlots(slots.filter((_, i) => i !== idx));
    setSaved(false);
  }

  function handleSave() {
    setError('');
    if (slots.length === 0) {
      setError('Tambahkan minimal 1 slot, atau hapus jadwal bila Anda tidak praktek.');
      return;
    }
    saveSchedule({ slot_duration_minutes: duration, slots });
  }

  function handleDelete() {
    if (!hasSchedule) return;
    setError('');
    deleteSchedule();
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
              onChange={e => { setDraftDuration(Number(e.target.value)); setSaved(false); }}
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

      {!managed && <ScheduleExceptions />}
    </div>
  );
}

/**
 * Tanggal libur / cuti.
 *
 * Endpoint tambah & hapus sudah lama ada dan mesin ketersediaan sudah
 * memperhitungkannya, tapi tidak ada satu pun tampilan yang memanggilnya —
 * terapis tidak punya cara menandai tanggal ia tidak praktek, sehingga slotnya
 * tetap bisa dipesan orang.
 *
 * Hanya untuk terapis independen: yang dikelola yayasan diblokir backend
 * dengan `403 MANAGED_BY_YAYASAN`, sama seperti jadwal mingguannya.
 */
function ScheduleExceptions() {
  const qc = useQueryClient();
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');

  const { data: exceptions = [], isPending } = useQuery({
    queryKey: qk.terapis.scheduleExceptions.list(),
    queryFn: () => api.getScheduleExceptions().catch(() => []),
    retry: false,
  });

  const { mutate: addException, isPending: adding } = useMutation({
    mutationFn: () => api.addScheduleException({ date, is_available: false, reason: reason.trim() || undefined }),
    onSuccess: () => {
      setDate('');
      setReason('');
      setErr('');
      qc.invalidateQueries({ queryKey: qk.terapis.scheduleExceptions.all() });
    },
    onError: (e: Error) => setErr(e.message || 'Gagal menambah tanggal libur'),
  });

  const { mutate: removeException } = useMutation({
    mutationFn: (id: string) => api.deleteScheduleException(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.terapis.scheduleExceptions.all() }),
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="mt-10 max-w-2xl">
      <h2 className="text-lg font-semibold text-white mb-1">Tanggal Libur</h2>
      <p className="text-slate-400 text-sm mb-4">
        Tanggal di sini dikecualikan dari jadwal mingguan — slotnya tidak muncul untuk dipesan.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!date) {
            setErr('Pilih tanggal dulu.');
            return;
          }
          addException();
        }}
        className="flex flex-col sm:flex-row gap-3 mb-5"
      >
        <div className="flex-1">
          <label htmlFor="exception-date" className="block text-xs text-slate-400 mb-1">
            Tanggal
          </label>
          <input
            id="exception-date"
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="exception-reason" className="block text-xs text-slate-400 mb-1">
            Alasan (opsional)
          </label>
          <input
            id="exception-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Cuti, libur nasional, pelatihan…"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Tambah
          </button>
        </div>
      </form>

      {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

      {isPending ? (
        <p className="text-sm text-slate-500">Memuat tanggal libur…</p>
      ) : exceptions.length === 0 ? (
        <p className="text-sm text-slate-500">Belum ada tanggal libur yang ditandai.</p>
      ) : (
        <ul className="space-y-2">
          {exceptions.map((ex) => (
            <li
              key={ex.id}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5"
            >
              <div>
                <p className="text-sm text-white">
                  {new Date(`${ex.date}T00:00:00`).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                {ex.reason && <p className="text-xs text-slate-500">{ex.reason}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeException(ex.id)}
                aria-label={`Hapus tanggal libur ${ex.date}`}
                className="text-slate-500 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

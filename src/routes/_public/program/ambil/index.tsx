import { useEffect, useMemo, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CalendarDays, Loader2, Plus, Target, Trash2 } from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { TherapySlotPref } from '@/lib/api/types';

export const Route = createFileRoute('/_public/program/ambil/')({
  head: () => ({
    meta: [
      { title: 'Ambil Program Terapi | DisabilitasKu' },
      { name: 'description', content: 'Susun paket terapi berjalan untuk anak Anda: jumlah sesi, jadwal, dan targetnya.' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { terapis?: string; anak?: string } => ({
    terapis: typeof search.terapis === 'string' && search.terapis ? search.terapis : undefined,
    anak: typeof search.anak === 'string' && search.anak ? search.anak : undefined,
  }),
  component: AmbilProgramPage,
});

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const SESSION_CHOICES = [4, 8, 12, 16, 24];

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

function addMinutes(clock: string, minutes: number) {
  const [h, m] = clock.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Jadwal mingguan terapis disimpan sebagai rentang ("09:00–12:00"). Pemesanan
 * berlangsung per slot, jadi rentang itu dipecah dulu memakai durasi slot
 * terapis — angka yang sama yang dipakai mesin ketersediaan di backend.
 */
function expandSlots(
  slots: { day_of_week: number; start_time: string; end_time: string; is_active: boolean }[],
  durationMinutes: number,
): TherapySlotPref[] {
  const out: TherapySlotPref[] = [];
  const step = durationMinutes > 0 ? durationMinutes : 60;
  for (const s of slots) {
    if (!s.is_active) continue;
    let cur = s.start_time;
    // Batas iterasi menjaga jadwal yang salah tulis (end < start) tidak
    // menggantung halaman.
    for (let i = 0; i < 48 && cur < s.end_time; i++) {
      const next = addMinutes(cur, step);
      if (next > s.end_time) break;
      out.push({ day_of_week: s.day_of_week, start_time: cur });
      cur = next;
    }
  }
  return out;
}

function AmbilProgramPage() {
  const { terapis: providerId, anak: childFromUrl } = Route.useSearch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [childId, setChildId] = useState(childFromUrl ?? '');
  const [totalSessions, setTotalSessions] = useState(8);
  const [picked, setPicked] = useState<TherapySlotPref[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [goals, setGoals] = useState<string[]>(['']);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate({ to: '/auth', search: { redirect: '/program/ambil' } });
  }, [authLoading, isAuthenticated, navigate]);

  const { data: children = [] } = useQuery({
    queryKey: qk.children.list(),
    queryFn: () => unwrap(apiClient.children.list()),
    enabled: !authLoading && isAuthenticated,
  });

  const { data: schedule, isPending: scheduleLoading } = useQuery({
    queryKey: qk.schedule.detail(providerId ?? ''),
    queryFn: () => unwrap(apiClient.schedule.getTherapistSchedule(providerId!)),
    enabled: !!providerId,
  });

  const { data: quote } = useQuery({
    queryKey: qk.programs.of('quote', { providerId, totalSessions }),
    queryFn: () => unwrap(apiClient.programs.quote(providerId!, totalSessions)),
    enabled: !!providerId,
  });

  const options = useMemo(() => {
    if (!schedule) return [];
    return expandSlots(schedule.slots ?? [], schedule.schedule?.slot_duration_minutes ?? 60);
  }, [schedule]);

  const byDay = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const o of options) {
      const list = map.get(o.day_of_week) ?? [];
      if (!list.includes(o.start_time)) list.push(o.start_time);
      map.set(o.day_of_week, list);
    }
    for (const list of map.values()) list.sort();
    return map;
  }, [options]);

  const isPicked = (day: number, time: string) =>
    picked.some((p) => p.day_of_week === day && p.start_time === time);

  const togglePick = (day: number, time: string) => {
    setPicked((prev) => {
      const exists = prev.some((p) => p.day_of_week === day && p.start_time === time);
      if (exists) return prev.filter((p) => !(p.day_of_week === day && p.start_time === time));
      // Lebih dari 5 jadwal per minggu ditolak backend; hentikan di sini supaya
      // kesalahannya terlihat sebelum tombol bayar ditekan.
      if (prev.length >= 5) return prev;
      return [...prev, { day_of_week: day, start_time: time }];
    });
  };

  const { mutate: createProgram, isPending: creating } = useMutation({
    mutationFn: () =>
      unwrap(
        apiClient.programs.create({
          child_id: childId || undefined,
          provider_id: providerId!,
          total_sessions: totalSessions,
          frequency_per_week: picked.length,
          start_date: startDate,
          preferred_slots: picked,
          goals: goals.filter((g) => g.trim()).map((g) => ({ title: g.trim() })),
        }),
      ),
    onSuccess: (data) => {
      if (data.redirect_url?.startsWith('http')) {
        window.location.href = data.redirect_url;
        return;
      }
      navigate({ to: '/program/bayar/$id', params: { id: data.program_id } });
    },
    onError: (e: Error) => {
      toast({ title: 'Gagal membuat program', description: e.message, variant: 'destructive' });
    },
  });

  if (!providerId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-gray-700">Pilih terapis terlebih dahulu untuk mengambil program terapi.</p>
        <Button className="mt-4" onClick={() => navigate({ to: '/terapis' })}>
          Cari terapis
        </Button>
      </div>
    );
  }

  // Orang tua wajib memilih anak; pengguna dewasa boleh mengambil program untuk
  // dirinya sendiri, jadi pilihan anak tidak menahan tombol bayar.
  const needsChild = children.length > 0;
  const canSubmit =
    (!needsChild || !!childId) && picked.length > 0 && totalSessions >= 4 && !creating && !!startDate;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ambil program terapi</h1>
        <p className="mt-1 text-sm text-gray-600">
          Terapi berjalan dibayar per paket. Setelah lunas, seluruh sesinya langsung masuk jadwal terapis —
          Anda tidak perlu memesan ulang tiap minggu.
        </p>
      </header>

      <div className="space-y-5">
        {/* Anak */}
        <Card>
          <CardContent className="space-y-3 py-5">
            <h2 className="font-semibold text-gray-900">Untuk siapa program ini</h2>
            {children.length === 0 ? (
              <p className="text-sm text-gray-600">
                Program akan dibuat atas nama Anda sendiri. Untuk anak,{' '}
                <button
                  type="button"
                  className="font-medium text-teal-700 hover:underline"
                  onClick={() => navigate({ to: '/anak-saya' })}
                >
                  tambahkan profil anak
                </button>{' '}
                terlebih dahulu.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChildId(c.id)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      childId === c.id
                        ? 'border-teal-600 bg-teal-50 font-medium text-teal-800'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {c.full_name}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jumlah sesi */}
        <Card>
          <CardContent className="space-y-3 py-5">
            <h2 className="font-semibold text-gray-900">Jumlah sesi</h2>
            <div className="flex flex-wrap gap-2">
              {SESSION_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setTotalSessions(n)}
                  className={`rounded-lg border px-4 py-2 text-sm ${
                    totalSessions === n
                      ? 'border-teal-600 bg-teal-50 font-medium text-teal-800'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {n} sesi
                </button>
              ))}
            </div>
            {quote && (
              <p className="text-sm text-gray-600">
                {formatRupiah(quote.price_per_session)} per sesi ·{' '}
                <span className="font-semibold text-gray-900">{formatRupiah(quote.amount)}</span> total
              </p>
            )}
          </CardContent>
        </Card>

        {/* Jadwal mingguan */}
        <Card>
          <CardContent className="space-y-3 py-5">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <CalendarDays className="h-4 w-4" /> Jadwal mingguan
            </h2>
            <p className="text-sm text-gray-600">
              Pilih hari dan jam tetap. Jumlah yang Anda pilih menjadi frekuensi per minggu —
              {picked.length > 0 ? ` sekarang ${picked.length}× per minggu.` : ' pilih minimal satu.'}
            </p>

            {scheduleLoading && (
              <p className="text-sm text-gray-500">
                <Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Memuat jadwal terapis…
              </p>
            )}

            {!scheduleLoading && byDay.size === 0 && (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Terapis ini belum memasang jadwal mingguan, jadi sesinya belum bisa diterbitkan otomatis.
                Hubungi terapis lewat halaman profilnya.
              </p>
            )}

            <div className="space-y-3">
              {[...byDay.entries()]
                .sort((a, b) => a[0] - b[0])
                .map(([day, times]) => (
                  <div key={day}>
                    <p className="mb-1.5 text-sm font-medium text-gray-700">{DAYS[day]}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {times.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => togglePick(day, t)}
                          className={`rounded-md border px-2.5 py-1.5 text-sm ${
                            isPicked(day, t)
                              ? 'border-teal-600 bg-teal-600 font-medium text-white'
                              : 'border-gray-200 text-gray-700 hover:border-teal-300'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            <div>
              <label htmlFor="start-date" className="mb-1 block text-sm font-medium text-gray-700">
                Mulai dari
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Target */}
        <Card>
          <CardContent className="space-y-3 py-5">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <Target className="h-4 w-4" /> Apa yang ingin dicapai
            </h2>
            <p className="text-sm text-gray-600">
              Opsional, tapi berguna: target membuat catatan tiap sesi punya arah yang bisa dinilai bersama
              terapis. Terapis bisa menambah atau menyesuaikannya nanti.
            </p>
            {goals.map((g, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={g}
                  onChange={(e) => setGoals((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                  placeholder="mis. Bisa menyusun kalimat dua kata"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                {goals.length > 1 && (
                  <button
                    type="button"
                    aria-label="Hapus target"
                    onClick={() => setGoals((prev) => prev.filter((_, idx) => idx !== i))}
                    className="rounded-lg border border-gray-200 px-2 text-gray-500 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {goals.length < 5 && (
              <button
                type="button"
                onClick={() => setGoals((prev) => [...prev, ''])}
                className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
              >
                <Plus className="h-4 w-4" /> Tambah target
              </button>
            )}
          </CardContent>
        </Card>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total paket</p>
              <p className="text-2xl font-bold text-gray-900">
                {quote ? formatRupiah(quote.amount) : '—'}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {totalSessions} sesi · {picked.length || 0}× per minggu
              </p>
            </div>
            <Button size="lg" disabled={!canSubmit} onClick={() => createProgram()}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lanjut bayar
            </Button>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Sesi baru dikunci di jadwal terapis setelah pembayaran diterima. Jika ada jam yang keburu terisi,
            sistem menggesernya ke minggu berikutnya dan memberi tahu Anda.
          </p>
        </div>
      </div>
    </div>
  );
}

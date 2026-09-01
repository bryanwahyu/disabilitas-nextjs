import { metaFrom } from '@/lib/seo/head';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarOff, Loader2, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/admin/dashboard/libur/')({
  head: () => metaFrom(metadata),
  component: LiburPage,
});

const metadata = { title: 'Hari Libur Nasional' };

const fmtDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/**
 * Hari libur nasional.
 *
 * Tabel ini sudah dipakai mesin ketersediaan slot (`computeAvailableSlots`
 * mengecualikannya), tapi halaman pengelolanya stub dan klien tidak punya
 * method apa pun — jadi satu-satunya cara mengisi daftar libur adalah lewat
 * database langsung. Akibatnya slot terapis tetap terbuka di tanggal merah.
 */
function LiburPage() {
  const qc = useQueryClient();
  const currentYear = String(new Date().getFullYear());
  const [year, setYear] = useState(currentYear);
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const { data: holidays = [], isPending } = useQuery({
    queryKey: qk.admin.holidays.list({ year }),
    queryFn: () => unwrap(apiClient.holidays.list(year)),
  });

  const { mutate: addHoliday, isPending: adding } = useMutation({
    mutationFn: () => unwrap(apiClient.holidays.create(date, name.trim())),
    onSuccess: () => {
      setDate('');
      setName('');
      setError('');
      qc.invalidateQueries({ queryKey: qk.admin.holidays.all() });
    },
    onError: (e: Error) => setError(e.message || 'Gagal menambah hari libur'),
  });

  const { mutate: removeHoliday } = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.holidays.remove(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.admin.holidays.all() }),
  });

  const years = [currentYear, String(Number(currentYear) + 1)];

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-2">Hari Libur Nasional</h1>
      <p className="text-slate-400 text-sm mb-8">
        Tanggal di sini otomatis menutup slot semua terapis — dipakai mesin ketersediaan jadwal.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!date || !name.trim()) {
            setError('Tanggal dan nama libur wajib diisi.');
            return;
          }
          addHoliday();
        }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        <div className="sm:w-48">
          <label htmlFor="holiday-date" className="block text-xs text-slate-400 mb-1">
            Tanggal
          </label>
          <input
            id="holiday-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="holiday-name" className="block text-xs text-slate-400 mb-1">
            Nama libur
          </label>
          <input
            id="holiday-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Idul Fitri, Hari Kemerdekaan…"
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

      {error && (
        <p role="alert" className="text-sm text-rose-400 mb-4">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 mb-4">
        <label htmlFor="holiday-year" className="text-sm text-slate-400">
          Tahun
        </label>
        <select
          id="holiday-year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y} className="bg-slate-900">
              {y}
            </option>
          ))}
        </select>
      </div>

      {isPending ? (
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat daftar libur…
        </div>
      ) : holidays.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-start gap-3">
            <CalendarOff className="h-5 w-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-white font-medium mb-1">Belum ada hari libur untuk {year}</p>
              <p className="text-sm text-slate-400">
                Selama daftar ini kosong, slot terapis tetap terbuka di tanggal merah dan bisa
                dipesan orang tua.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {holidays.map((h) => (
            <li
              key={h.id}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5"
            >
              <div>
                <p className="text-sm text-white">{h.name}</p>
                <p className="text-xs text-slate-500">{fmtDate(h.date)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeHoliday(h.id)}
                aria-label={`Hapus hari libur ${h.name}`}
                className="text-slate-500 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

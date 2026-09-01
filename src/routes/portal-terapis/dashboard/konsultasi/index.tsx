import { createFileRoute } from '@tanstack/react-router';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ClipboardList, Loader2, RefreshCw } from 'lucide-react';
import { api, ApiError } from '@/lib/terapis/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-terapis/dashboard/konsultasi/')({
  component: KonsultasiPage,
});


function fmtDate(s?: string) {
  if (!s) return '-';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function rupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

// Keluhan & ringkasan skrining disimpan sebagai JSON; parse defensif supaya
// satu baris rusak tak menjatuhkan antrian.
function parseList(raw?: string): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function parseSummary(raw?: string): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function KonsultasiPage() {
  const {
    data: items = [],
    // isFetching, bukan isPending: tombol "Muat ulang" tetap memberi umpan balik.
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: qk.terapis.consultations.list({ status: 'paid' }),
    queryFn: () => api.getConsultationQueue('paid'),
  });

  const error = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : 'Gagal memuat antrian konsultasi'
    : null;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-white">Antrian konsultasi</h1>
          <p className="text-sm text-slate-400">
            Keluhan yang sudah dibayar orang tua. Baca sebelum sesi agar konsultasi langsung tepat sasaran.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" /> Muat ulang
        </button>
      </div>

      {isFetching ? (
        <div className="flex items-center gap-2 py-12 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat antrian...
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4" /> {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-10 text-center">
          <ClipboardList className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p className="text-sm text-slate-400">Belum ada konsultasi berbayar yang masuk.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => {
            const keluhan = parseList(c.intake?.complaints);
            const summary = parseSummary(c.intake?.assessment_summary);
            return (
              <div key={c.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Konsultasi screening</p>
                    <p className="text-xs text-slate-500">
                      Dibayar {fmtDate(c.paid_at ?? c.created_at)} · {rupiah(c.amount)}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-900/40 px-2.5 py-1 text-xs text-emerald-300">Lunas</span>
                </div>

                {keluhan.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-semibold text-slate-300">Keluhan</p>
                    <div className="flex flex-wrap gap-1.5">
                      {keluhan.map((k, i) => (
                        <span key={i} className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {c.intake?.main_concern && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-semibold text-slate-300">Kekhawatiran utama</p>
                    <p className="whitespace-pre-line text-sm text-slate-400">{c.intake.main_concern}</p>
                  </div>
                )}

                {summary && (
                  <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
                    <p className="mb-1 text-xs font-semibold text-slate-300">Hasil skrining terlampir</p>
                    <p className="text-xs text-slate-400">
                      {String(summary.type ?? '-').toUpperCase()} · usia {String(summary.age_month ?? '-')} bln ·
                      interpretasi <span className="text-slate-200">{String(summary.interpretation ?? '-')}</span>
                      {summary.score != null && summary.max_score != null
                        ? ` · skor ${String(summary.score)}/${String(summary.max_score)}`
                        : ''}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

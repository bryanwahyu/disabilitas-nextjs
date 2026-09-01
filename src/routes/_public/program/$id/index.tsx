import { useEffect } from 'react';
import { Link, createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarClock, CheckCircle2, Loader2, Star, Target } from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import { ApiResponseError, unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { TherapyProgramSession } from '@/lib/api/types';

export const Route = createFileRoute('/_public/program/$id/')({
  head: () => ({
    meta: [
      { title: 'Progres Program Terapi | DisabilitasKu' },
      { name: 'description', content: 'Perkembangan anak Anda di program terapi berjalan.' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ProgramDetailPage,
});

const SESSION_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Menunggu konfirmasi', className: 'bg-gray-100 text-gray-700' },
  confirmed: { label: 'Terjadwal', className: 'bg-sky-100 text-sky-800' },
  completed: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-800' },
  no_show: { label: 'Tidak hadir', className: 'bg-amber-100 text-amber-800' },
  cancelled: { label: 'Dibatalkan', className: 'bg-gray-100 text-gray-500' },
};

function fmtDateTime(s?: string | null) {
  if (!s) return '-';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function SessionItem({ s }: { s: TherapyProgramSession }) {
  const st = SESSION_STATUS[s.status] ?? SESSION_STATUS.pending;
  return (
    <li className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
          {s.session_seq || '–'}
        </span>
        <span className="text-sm text-gray-800">{fmtDateTime(s.start_at)}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
        {s.progress_rating != null && (
          <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {s.progress_rating}/5
          </span>
        )}
      </div>
      {s.activity && <p className="mt-2 text-sm text-gray-700">{s.activity}</p>}
      {s.status === 'completed' && !s.has_note && (
        <p className="mt-1 text-xs text-gray-500">Catatan terapis belum tersedia untuk sesi ini.</p>
      )}
    </li>
  );
}

function ProgramDetailPage() {
  const { id } = useParams({ from: '/_public/program/$id/' });
  const navigate = useNavigate();

  const { data: program, isPending, error } = useQuery({
    queryKey: qk.programs.detail(id),
    queryFn: () => unwrap(apiClient.programs.get(id)),
    enabled: !!id,
  });

  const unauthorized = error instanceof ApiResponseError && error.status === 401;

  useEffect(() => {
    if (unauthorized) navigate({ to: '/auth', search: { redirect: '/program' } });
  }, [unauthorized, navigate]);

  if (isPending || unauthorized) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-gray-500">
        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Memuat…
      </div>
    );
  }

  if (!program) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-gray-600">
        Program tidak ditemukan.{' '}
        <Link to="/program" className="font-medium text-teal-700 hover:underline">
          Kembali
        </Link>
      </div>
    );
  }

  const st = program.stats;
  const belumBayar = program.status === 'draft' || program.status === 'pending_payment';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/program" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> Semua program
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">{program.child_name}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {program.title}
          {program.therapist_name ? ` · ${program.therapist_name}` : program.provider_name ? ` · ${program.provider_name}` : ''}
        </p>
      </header>

      {belumBayar && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            Program ini belum dibayar, jadi sesinya belum masuk jadwal terapis.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link to="/program/bayar/$id" params={{ id: program.id }}>
              Selesaikan pembayaran
            </Link>
          </Button>
        </div>
      )}

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Sesi dihadiri" value={`${st.attended}`} hint={`dari ${st.total_sessions} sesi`} />
        <Stat label="Sisa sesi" value={`${st.remaining}`} hint={st.absent > 0 ? `${st.absent} tidak hadir` : undefined} />
        <Stat
          label="Rata-rata progres"
          value={st.avg_rating > 0 ? `${st.avg_rating.toFixed(1)}/5` : '–'}
          hint="penilaian terapis"
        />
        <Stat label="Target tercapai" value={`${st.goals_achieved}/${st.goals_total}`} />
      </section>

      {st.next_session_at && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800">
          <CalendarClock className="h-4 w-4 text-teal-600" />
          Sesi berikutnya {fmtDateTime(st.next_session_at)}
        </p>
      )}

      {program.goals.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <Target className="h-4 w-4" /> Target terapi
          </h2>
          <ul className="space-y-2">
            {program.goals.map((g) => (
              <li key={g.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start gap-2">
                  {g.status === 'achieved' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-300" />
                  )}
                  <div>
                    <p className={`font-medium ${g.status === 'achieved' ? 'text-emerald-800' : 'text-gray-900'}`}>
                      {g.title}
                    </p>
                    {g.target && <p className="mt-0.5 text-sm text-gray-600">Target: {g.target}</p>}
                    {g.status === 'achieved' && g.achieved_at && (
                      <p className="mt-0.5 text-xs text-emerald-700">Tercapai {g.achieved_at}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {program.evaluations.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold text-gray-900">Evaluasi terapis</h2>
          <ul className="space-y-2">
            {program.evaluations.map((e) => (
              <li key={e.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Periode {e.period}</span>
                  <span>{e.sessions_count} sesi</span>
                </div>
                <p className="mt-2 text-sm text-gray-800">{e.summary}</p>
                {e.recommendation && (
                  <p className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">Saran: </span>
                    {e.recommendation}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 mb-10">
        <h2 className="mb-3 font-semibold text-gray-900">Riwayat sesi</h2>
        {program.sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-600">
            Belum ada sesi terjadwal.
          </p>
        ) : (
          <ul className="space-y-2">
            {program.sessions.map((s) => (
              <SessionItem key={s.appointment_id} s={s} />
            ))}
          </ul>
        )}
        {program.status === 'active' && st.scheduled < st.total_sessions && (
          <p className="mt-2 text-xs text-amber-700">
            Baru {st.scheduled} dari {st.total_sessions} sesi yang bisa dijadwalkan dari jadwal terapis. Terapis
            akan menghubungi Anda untuk sisanya.
          </p>
        )}
      </section>
    </div>
  );
}

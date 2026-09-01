import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ClipboardList,
  Loader2,
  NotebookPen,
  Plus,
  Star,
  Target,
  UserX,
} from 'lucide-react';

import { api, ApiError, type TherapyGoal, type TherapyProgramSession } from '@/lib/terapis/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-terapis/dashboard/program/$id')({
  component: ProgramDetailPage,
});

function fmtDateTime(s?: string | null) {
  if (!s) return '-';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SESSION_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Menunggu', className: 'bg-slate-700 text-slate-300' },
  confirmed: { label: 'Terjadwal', className: 'bg-sky-500/15 text-sky-300' },
  completed: { label: 'Hadir', className: 'bg-emerald-500/15 text-emerald-300' },
  no_show: { label: 'Tidak datang', className: 'bg-amber-500/15 text-amber-300' },
  cancelled: { label: 'Batal', className: 'bg-slate-700 text-slate-400' },
};

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function GoalRow({
  goal,
  onAchieve,
  busy,
}: {
  goal: TherapyGoal;
  onAchieve: (id: string) => void;
  busy: boolean;
}) {
  const achieved = goal.status === 'achieved';
  return (
    <li className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${achieved ? 'text-emerald-300 line-through' : 'text-slate-100'}`}>
          {goal.title}
        </p>
        {goal.target && <p className="mt-0.5 text-sm text-slate-400">Target: {goal.target}</p>}
        {goal.baseline && <p className="mt-0.5 text-xs text-slate-500">Kondisi awal: {goal.baseline}</p>}
        {achieved && goal.achieved_at && (
          <p className="mt-1 text-xs text-emerald-400/80">Tercapai {goal.achieved_at}</p>
        )}
      </div>
      {!achieved && (
        <button
          type="button"
          onClick={() => onAchieve(goal.id)}
          disabled={busy}
          className="shrink-0 rounded-lg border border-emerald-800 bg-emerald-950/40 px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/40 disabled:opacity-50"
        >
          <Check className="mr-1 inline h-3.5 w-3.5" />
          Tandai tercapai
        </button>
      )}
    </li>
  );
}

function SessionRow({
  s,
  onAbsent,
  busy,
}: {
  s: TherapyProgramSession;
  onAbsent: (apptId: string) => void;
  busy: boolean;
}) {
  const st = SESSION_STATUS[s.status] ?? SESSION_STATUS.pending;
  const upcoming = s.status === 'pending' || s.status === 'confirmed';
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
        {s.session_seq || '–'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-200">{fmtDateTime(s.start_at)}</p>
        {s.activity && <p className="truncate text-xs text-slate-500">{s.activity}</p>}
      </div>
      {s.progress_rating != null && (
        <span className="inline-flex items-center gap-0.5 text-xs text-amber-300">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {s.progress_rating}
        </span>
      )}
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
      {s.status === 'completed' && !s.has_note && (
        <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs text-rose-300">Jurnal kosong</span>
      )}
      {upcoming && (
        <div className="flex items-center gap-2">
          <Link
            to="/portal-terapis/dashboard/jurnal"
            className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            <NotebookPen className="mr-1 inline h-3.5 w-3.5" />
            Isi jurnal
          </Link>
          <button
            type="button"
            onClick={() => onAbsent(s.appointment_id)}
            disabled={busy}
            className="rounded-lg border border-amber-900/60 px-2.5 py-1.5 text-xs text-amber-300 hover:bg-amber-950/40 disabled:opacity-50"
          >
            <UserX className="mr-1 inline h-3.5 w-3.5" />
            Tidak datang
          </button>
        </div>
      )}
    </li>
  );
}

function ProgramDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [error, setError] = useState('');

  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [evalSummary, setEvalSummary] = useState('');
  const [evalRecommendation, setEvalRecommendation] = useState('');
  const [evalNextStep, setEvalNextStep] = useState<'continue' | 'graduate' | 'refer'>('continue');

  const { data: program, isPending } = useQuery({
    queryKey: qk.programs.detail(id),
    queryFn: () => api.getProgram(id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.programs.detail(id) });
    qc.invalidateQueries({ queryKey: qk.programs.lists() });
  };

  const fail = (e: unknown) => setError(e instanceof ApiError ? e.message : 'Gagal menyimpan. Coba lagi.');

  const addGoal = useMutation({
    mutationFn: () => api.addProgramGoal(id, { title: goalTitle, target: goalTarget || undefined }),
    onSuccess: () => {
      setGoalTitle('');
      setGoalTarget('');
      setError('');
      invalidate();
    },
    onError: fail,
  });

  const achieveGoal = useMutation({
    mutationFn: (goalId: string) => api.updateProgramGoal(id, goalId, { status: 'achieved' }),
    onSuccess: () => {
      setError('');
      invalidate();
    },
    onError: fail,
  });

  const markAbsent = useMutation({
    mutationFn: (apptId: string) => api.setAppointmentStatus(apptId, 'no_show'),
    onSuccess: () => {
      setError('');
      invalidate();
    },
    onError: fail,
  });

  const addEvaluation = useMutation({
    mutationFn: () =>
      api.addProgramEvaluation(id, {
        summary: evalSummary,
        recommendation: evalRecommendation || undefined,
        next_step: evalNextStep,
      }),
    onSuccess: () => {
      setEvalSummary('');
      setEvalRecommendation('');
      setError('');
      invalidate();
    },
    onError: fail,
  });

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 text-sm text-slate-400">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Memuat program…
      </div>
    );
  }

  if (!program) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <p className="text-slate-300">Program tidak ditemukan.</p>
        <Link to="/portal-terapis/dashboard/program" className="mt-3 inline-block text-sm text-sky-400">
          Kembali ke daftar program
        </Link>
      </div>
    );
  }

  const st = program.stats;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <Link
        to="/portal-terapis/dashboard/program"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> Semua program
      </Link>

      <header className="mt-4">
        <h1 className="text-xl font-semibold text-slate-100">{program.child_name}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {program.title} · {program.frequency_per_week}× per minggu · mulai {program.start_date}
        </p>
      </header>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-900/50 bg-rose-950/40 p-3 text-sm text-rose-300">{error}</p>
      )}

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Sesi dihadiri" value={`${st.attended}`} hint={`dari ${st.total_sessions} kuota`} />
        <StatTile label="Sisa kuota" value={`${st.remaining}`} hint={st.absent > 0 ? `${st.absent} tidak datang` : undefined} />
        <StatTile
          label="Rata-rata progres"
          value={st.avg_rating > 0 ? st.avg_rating.toFixed(1) : '–'}
          hint="skala 1–5"
        />
        <StatTile label="Target tercapai" value={`${st.goals_achieved}/${st.goals_total}`} />
      </section>

      {st.next_session_at && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-300">
          <CalendarClock className="h-4 w-4 text-sky-400" />
          Sesi berikutnya {fmtDateTime(st.next_session_at)}
        </p>
      )}

      {/* Target terapi */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
          <Target className="h-4 w-4" /> Target terapi
        </h2>

        {program.goals.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-800 p-4 text-sm text-slate-500">
            Belum ada target. Tanpa target, jurnal sesi hanya jadi catatan harian — tuliskan minimal satu hal yang
            sedang dikejar program ini.
          </p>
        ) : (
          <ul className="space-y-2">
            {program.goals.map((g) => (
              <GoalRow key={g.id} goal={g} onAchieve={achieveGoal.mutate} busy={achieveGoal.isPending} />
            ))}
          </ul>
        )}

        <form
          className="mt-3 space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (goalTitle.trim()) addGoal.mutate();
          }}
        >
          <input
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="Target baru, mis. 'Duduk mandiri 5 menit tanpa sandaran'"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
          />
          <input
            value={goalTarget}
            onChange={(e) => setGoalTarget(e.target.value)}
            placeholder="Kriteria tercapai (opsional), mis. 'berhasil 4 dari 5 percobaan'"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={!goalTitle.trim() || addGoal.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {addGoal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Tambah target
          </button>
        </form>
      </section>

      {/* Sesi */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
          <ClipboardList className="h-4 w-4" /> Sesi ({program.sessions.length} terjadwal)
        </h2>
        {program.sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-800 p-4 text-sm text-slate-500">
            Belum ada sesi yang terbit. Sesi muncul otomatis setelah paket dibayar.
          </p>
        ) : (
          <ul className="space-y-2">
            {program.sessions.map((s) => (
              <SessionRow key={s.appointment_id} s={s} onAbsent={markAbsent.mutate} busy={markAbsent.isPending} />
            ))}
          </ul>
        )}
        {st.scheduled < st.total_sessions && program.status === 'active' && (
          <p className="mt-2 text-xs text-amber-300">
            Baru {st.scheduled} dari {st.total_sessions} sesi yang bisa dijadwalkan dari jadwal Anda. Sisanya perlu
            diatur manual bersama orang tua.
          </p>
        )}
      </section>

      {/* Evaluasi */}
      <section className="mt-8 mb-10">
        <h2 className="mb-3 text-sm font-medium text-slate-300">Evaluasi berkala</h2>

        {program.evaluations.length > 0 && (
          <ul className="mb-3 space-y-2">
            {program.evaluations.map((e) => (
              <li key={e.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Periode {e.period}</span>
                  <span>{e.sessions_count} sesi dinilai</span>
                </div>
                <p className="mt-1.5 text-sm text-slate-200">{e.summary}</p>
                {e.recommendation && <p className="mt-1 text-sm text-slate-400">Saran: {e.recommendation}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  Langkah berikut:{' '}
                  {e.next_step === 'graduate' ? 'selesai' : e.next_step === 'refer' ? 'rujuk' : 'lanjut'}
                </p>
              </li>
            ))}
          </ul>
        )}

        <form
          className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (evalSummary.trim()) addEvaluation.mutate();
          }}
        >
          <textarea
            value={evalSummary}
            onChange={(e) => setEvalSummary(e.target.value)}
            rows={3}
            placeholder="Ringkasan perkembangan periode ini"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
          />
          <textarea
            value={evalRecommendation}
            onChange={(e) => setEvalRecommendation(e.target.value)}
            rows={2}
            placeholder="Saran untuk keluarga (opsional)"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={evalNextStep}
              onChange={(e) => setEvalNextStep(e.target.value as 'continue' | 'graduate' | 'refer')}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              <option value="continue">Lanjut program berikutnya</option>
              <option value="graduate">Target tercapai, tidak perlu lanjut</option>
              <option value="refer">Rujuk ke layanan lain</option>
            </select>
            <button
              type="submit"
              disabled={!evalSummary.trim() || addEvaluation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {addEvaluation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan evaluasi
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

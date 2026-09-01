
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError, unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { konsultasiHref } from '@/lib/konsultasi';
import type {
  DenverAnswer,
  DenverOutcome,
  DenverInterpretation,
} from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, HelpCircle, ArrowLeft, ShieldAlert, Loader2 } from 'lucide-react';

const SECTOR_LABEL: Record<string, string> = {
  sosialisasi_kemandirian: 'Personal Sosial',
  motorik_halus: 'Motorik Halus-Adaptif',
  bicara_bahasa: 'Bahasa',
  motorik_kasar: 'Motorik Kasar',
};

const INTERP: Record<
  DenverInterpretation,
  { label: string; className: string; icon: React.ReactNode; desc: string }
> = {
  normal: {
    label: 'Tidak ada tanda keterlambatan',
    className: 'bg-green-100 text-green-800',
    icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
    desc: 'Perkembangan anak tampak sesuai. Lanjutkan stimulasi rutin dan pantau berkala.',
  },
  suspect: {
    label: 'Ada tanda yang perlu perhatian',
    className: 'bg-red-100 text-red-800',
    icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
    desc: 'Ditemukan indikasi keterlambatan. Sebaiknya konsultasikan ke terapis atau dokter tumbuh kembang untuk pemeriksaan lanjutan.',
  },
  untestable: {
    label: 'Belum dapat disimpulkan',
    className: 'bg-gray-200 text-gray-700',
    icon: <HelpCircle className="h-6 w-6 text-gray-500" />,
    desc: 'Terlalu banyak item yang tidak dapat dinilai. Coba ulangi skrining saat anak lebih kooperatif.',
  },
};

/**
 * DenverScreening — skrining Denver II (DDST-II) sebagai HALAMAN penuh (bukan modal).
 *  - mode="save": anak login → hasil DISIMPAN ke profil (butuh childId).
 *  - mode="public": pengunjung/guest → hasil dihitung TANPA disimpan.
 * Alat SKRINING PERINGATAN dini, bukan diagnosis.
 */
export default function DenverScreening({
  childId,
  ageMonth,
  mode,
}: {
  childId?: string;
  ageMonth: number;
  mode: 'save' | 'public';
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [outcome, setOutcome] = useState<DenverOutcome | null>(null);
  // Hasil yang tersimpan punya id assessment → dilampirkan ke intake konsultasi.
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  const { data: form, isLoading: loading } = useQuery({
    queryKey: qk.tumbuhKembang.of('denver-questions', { ageMonth }),
    queryFn: () => unwrap(apiClient.children.denverQuestions(ageMonth)),
    enabled: ageMonth > 0,
    // Lembar item Denver per usia bersifat statis.
    staleTime: 30 * 60 * 1000,
  });

  // Mode simpan butuh login: ambil nama anak dari childId (bukan dari URL, demi UU PDP)
  // sekaligus memverifikasi kepemilikan. 401/403 → arahkan login.
  const { data: child, error: childError } = useQuery({
    queryKey: qk.children.detail(childId ?? ''),
    queryFn: () => unwrap(apiClient.children.get(childId!)),
    enabled: mode === 'save' && !!childId,
  });

  const childName = child?.full_name;

  useEffect(() => {
    const status = childError instanceof ApiResponseError ? childError.status : undefined;
    if (status !== 401 && status !== 403) return;
    toast({ title: 'Perlu masuk', description: 'Masuk untuk menyimpan hasil ke profil anak.', variant: 'destructive' });
    navigate({ to: '/auth' });
  }, [childError, navigate, toast]);

  // Pindah langkah / lihat hasil → gulir ke atas panel.
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [stepIdx, outcome]);

  const allItems = useMemo(
    () => (form ? form.sectors.flatMap((s) => s.items) : []),
    [form],
  );
  const allAnswered = allItems.length > 0 && allItems.every((it) => answers[it.no] !== undefined);
  const answeredCount = allItems.filter((it) => answers[it.no] !== undefined).length;
  const sectors = form?.sectors ?? [];
  const currentSector = sectors[stepIdx];
  const isLastStep = stepIdx >= sectors.length - 1;
  const currentAnswered = currentSector
    ? currentSector.items.every((it) => answers[it.no] !== undefined)
    : false;

  const bulkSet = (items: { no: number }[], passed: boolean) =>
    setAnswers((a) => {
      const next = { ...a };
      items.forEach((it) => {
        next[it.no] = passed;
      });
      return next;
    });

  const { mutate: submitScreening, isPending: saving } = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error('Item skrining belum siap');
      const payload: DenverAnswer[] = allItems.map((it) => ({
        ...it,
        passed: answers[it.no] === true,
      }));

      if (mode === 'save' && childId) {
        const a = await unwrap(
          apiClient.children.submitDenver(childId, {
            age_month: form.age_month,
            answers: payload,
          })
        );
        if (!a) throw new Error('Gagal menyimpan');
        return {
          assessmentId: a.id ?? null,
          outcome: {
            age_month: a.age_month,
            items: a.answers ? JSON.parse(a.answers) : [],
            passed: a.score ?? 0,
            max: a.max_score ?? payload.length,
            cautions: 0,
            delays: 0,
            sector_concern: a.domain_scores ? JSON.parse(a.domain_scores) : {},
            interpretation: (a.interpretation as DenverInterpretation) ?? 'normal',
          } satisfies DenverOutcome,
        };
      }

      const res = await unwrap(
        apiClient.public.denver.screen({
          age_month: form.age_month,
          answers: payload,
        })
      );
      if (!res) throw new Error('Gagal menghitung');
      return { assessmentId: null, outcome: res };
    },
    onSuccess: (result) => {
      setAssessmentId(result.assessmentId);
      setOutcome(result.outcome);
    },
    onError: (e: Error) => {
      toast({ title: 'Gagal', description: e.message || 'Gagal memproses skrining', variant: 'destructive' });
    },
  });

  const handleSubmit = () => submitScreening();

  const concernedSectors = outcome
    ? Object.entries(outcome.sector_concern)
        .filter(([, n]) => n > 0)
        .map(([sec]) => SECTOR_LABEL[sec] ?? sec)
    : [];

  const goBack = () => (mode === 'save' && childId ? navigate({ to: `/anak-saya/${childId}` }) : navigate({ to: '/tumbuh-kembang' }));

  return (
    <div ref={topRef} className="mx-auto max-w-2xl px-4 py-8">
      <button
        type="button"
        onClick={goBack}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <ShieldAlert className="h-6 w-6 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Skrining Denver II{childName ? ` — ${childName}` : ''}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          Tandai kemampuan yang <b>sudah</b> atau <b>belum</b> bisa dilakukan anak. Denver II
          adalah alat skrining untuk memberi peringatan dini — bukan diagnosis.
        </p>
      </div>

      {ageMonth <= 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-gray-600">
            Usia anak belum diketahui. Pilih usia anak dulu di halaman Tumbuh Kembang.
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat item skrining...
          </CardContent>
        </Card>
      ) : !form || allItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-gray-600">
            Belum ada item Denver untuk usia ini.
          </CardContent>
        </Card>
      ) : outcome ? (
        <Card className="border-2">
          <CardContent className="space-y-4 py-6 text-center">
            <div className="flex justify-center">{INTERP[outcome.interpretation].icon}</div>
            <Badge className={INTERP[outcome.interpretation].className}>
              {INTERP[outcome.interpretation].label}
            </Badge>
            <p className="mx-auto max-w-md text-sm text-gray-600">
              {INTERP[outcome.interpretation].desc}
            </p>

            {concernedSectors.length > 0 && (
              <div className="mx-auto max-w-md rounded-lg border bg-red-50 p-3 text-left">
                <p className="text-xs font-semibold text-red-700">Sektor yang perlu perhatian</p>
                <p className="mt-1 text-xs text-red-600">{concernedSectors.join(', ')}</p>
              </div>
            )}

            {outcome.interpretation !== 'normal' && (
              <div className="mx-auto max-w-sm space-y-2 text-left">
                {/* Jembatan skrining → tindakan: langkah antara yang murah
                    sebelum ortu harus memilih terapis sendiri. */}
                <Link
                  to={konsultasiHref(assessmentId, childId)}
                  className="flex w-full items-center justify-center rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
                >
                  Konsultasi bahas hasil — Rp50.000
                </Link>
                <Link
                  to="/rekomendasi"
                  className="flex w-full items-center justify-center rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Cari terapis yang sesuai
                </Link>
                <Link
                  to="/tumbuh-kembang" hash="stimulasi"
                  className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Panduan stimulasi di rumah
                </Link>
              </div>
            )}
            {mode === 'public' && (
              <div className="mx-auto max-w-md rounded-lg border border-teal-100 bg-teal-50/50 p-3">
                <p className="text-xs text-gray-600">
                  Hasil ini <b>tidak disimpan</b>.{' '}
                  <Link to="/auth" className="font-medium text-teal-700 hover:underline">
                    Masuk
                  </Link>{' '}
                  untuk menyimpan hasil ke profil anak dan memantau perkembangan berkala.
                </p>
              </div>
            )}
            <p className="text-[11px] text-gray-500">
              Skrining ini bukan diagnosis. Pemeriksaan Denver II resmi oleh tenaga terlatih tetap
              diperlukan untuk memastikan. Data hasil hanya dapat diakses oleh Anda sebagai orang tua
              dan disimpan sesuai UU Perlindungan Data Pribadi.
            </p>
            <div className="pt-2">
              <Button onClick={goBack}>Selesai</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4 py-5">
            {/* Progress */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Bagian {stepIdx + 1}/{sectors.length} · usia {form.age_month} bln
                </span>
                <span>
                  {answeredCount}/{allItems.length} terjawab
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-teal-500 transition-all"
                  style={{ width: `${allItems.length ? (answeredCount / allItems.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {currentSector && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800">{currentSector.label}</h4>
                  <button
                    type="button"
                    onClick={() => bulkSet(currentSector.items, true)}
                    className="text-xs font-medium text-teal-600 hover:underline"
                  >
                    Semua sudah bisa
                  </button>
                </div>
                {currentSector.items.map((it) => {
                  const val = answers[it.no];
                  return (
                    <div
                      key={it.no}
                      className={`rounded-lg border p-3 transition-colors ${val === undefined ? '' : 'border-teal-200 bg-teal-50/40'}`}
                    >
                      <p className="text-sm text-gray-800">{it.text}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAnswers((a) => ({ ...a, [it.no]: true }))}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2.5 text-sm transition-colors ${val === true ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300'}`}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Sudah bisa
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnswers((a) => ({ ...a, [it.no]: false }))}
                          className={`flex flex-1 items-center justify-center rounded-md border px-3 py-2.5 text-sm transition-colors ${val === false ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'}`}
                        >
                          Belum bisa
                        </button>
                      </div>
                    </div>
                  );
                })}
                {!currentAnswered && (
                  <p className="pt-1 text-center text-xs text-gray-500">
                    Jawab semua item bagian ini untuk lanjut
                  </p>
                )}
              </div>
            )}

            {/* Stepper */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={stepIdx === 0 ? goBack : () => setStepIdx((s) => Math.max(s - 1, 0))}
              >
                {stepIdx === 0 ? 'Batal' : 'Kembali'}
              </Button>
              <div className="flex-1" />
              {!isLastStep ? (
                <Button
                  onClick={() => setStepIdx((s) => Math.min(s + 1, sectors.length - 1))}
                  disabled={!currentAnswered}
                >
                  Lanjut
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!allAnswered || saving}>
                  {saving ? 'Memproses...' : 'Lihat Hasil'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

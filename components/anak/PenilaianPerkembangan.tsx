
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { konsultasiHref } from '@/lib/konsultasi';
import type {
  AssessmentInterpretation,
  KPSPAnswer,
  KPSPDomain,
} from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Activity, ClipboardCheck, LineChart as LineIcon, Info, ShieldAlert } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

const DOMAIN_LABEL: Record<KPSPDomain, string> = {
  motorik_kasar: 'Motorik Kasar',
  motorik_halus: 'Motorik Halus',
  bicara_bahasa: 'Bicara & Bahasa',
  sosialisasi_kemandirian: 'Sosial & Kemandirian',
};

const DOMAINS: KPSPDomain[] = [
  'motorik_kasar',
  'motorik_halus',
  'bicara_bahasa',
  'sosialisasi_kemandirian',
];

const INTERP: Record<AssessmentInterpretation, { label: string; className: string }> = {
  sesuai: { label: 'Sesuai usia', className: 'bg-green-100 text-green-800' },
  meragukan: { label: 'Meragukan', className: 'bg-yellow-100 text-yellow-800' },
  penyimpangan: { label: 'Perlu perhatian', className: 'bg-red-100 text-red-800' },
};

// Akses aman: interpretation dari API bisa saja di luar 3 nilai KPSP (baris lama /
// tipe lain). Jangan sampai lookup undefined membuat kartu blank.
function safeInterp(i?: string): { label: string; className: string } {
  if (i && i in INTERP) return INTERP[i as AssessmentInterpretation];
  return { label: i || 'Belum dinilai', className: 'bg-gray-100 text-gray-700' };
}

function ageInMonths(dob?: string): number {
  if (!dob) return 0;
  const b = new Date(dob);
  if (isNaN(b.getTime())) return 0;
  const now = new Date();
  let m = (now.getFullYear() - b.getFullYear()) * 12 + now.getMonth() - b.getMonth();
  if (now.getDate() < b.getDate()) m--;
  return m < 0 ? 0 : m;
}

function shortDate(d: string): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
}

// Domain dengan paling banyak jawaban "Tidak" = paling perlu perhatian.
// Sumber: Assessment.answers (JSON KPSPAnswer[]). null bila tak ada / tak bisa dihitung.
function weakestDomain(answersJson?: string): KPSPDomain | null {
  if (!answersJson) return null;
  try {
    const answers = JSON.parse(answersJson) as KPSPAnswer[];
    const noCount: Partial<Record<KPSPDomain, number>> = {};
    for (const a of answers) {
      if (a.ya === false && a.domain) noCount[a.domain] = (noCount[a.domain] ?? 0) + 1;
    }
    let worst: KPSPDomain | null = null;
    let max = 0;
    for (const d of DOMAINS) {
      const c = noCount[d] ?? 0;
      if (c > max) {
        max = c;
        worst = d;
      }
    }
    return worst;
  } catch {
    return null;
  }
}

// Blok tindakan setelah skrining meragukan/penyimpangan (Fase 4a).
// Dipakai di hasil dialog dan di ringkasan hasil terakhir pada kartu.
function LangkahSelanjutnya({
  interp,
  weakDomain,
  assessmentId,
  childId,
}: {
  interp: AssessmentInterpretation;
  weakDomain?: KPSPDomain | null;
  assessmentId?: string;
  childId?: string;
}) {
  if (interp === 'sesuai') return null;
  return (
    <div className="mt-4 space-y-2 text-left rounded-lg border bg-gray-50 p-3">
      <p className="text-xs font-semibold text-gray-700">Langkah selanjutnya</p>
      {weakDomain && (
        <p className="text-xs text-gray-600">
          Domain yang paling perlu perhatian:{' '}
          <span className="font-medium text-gray-800">{DOMAIN_LABEL[weakDomain]}</span>.
        </p>
      )}
      {/* Langkah antara yang murah sebelum ortu harus memilih terapis sendiri. */}
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
      <p className="text-[11px] text-gray-500">
        Skrining ini bukan diagnosis. Pemeriksaan dokter tumbuh kembang tetap diperlukan untuk memastikan.
      </p>
    </div>
  );
}

// Data contoh saat riwayat penilaian belum cukup untuk digambar.
const DUMMY_KPSP = [
  { label: 'Contoh 1', score: 6, max: 10 },
  { label: 'Contoh 2', score: 8, max: 10 },
  { label: 'Contoh 3', score: 9, max: 10 },
];
const DUMMY_RADAR = DOMAINS.map((d, i) => ({
  domain: DOMAIN_LABEL[d],
  skor: [60, 70, 55, 75][i],
}));

export default function PenilaianPerkembangan({
  childId,
  childName,
  dateOfBirth,
}: {
  childId: string;
  childName: string;
  dateOfBirth?: string;
}) {
  const navigate = useNavigate();
  const [kpspOpen, setKpspOpen] = useState(false);

  const { data: assessments = [], isLoading: loading } = useQuery({
    queryKey: qk.children.sub(childId, 'assessments'),
    queryFn: () => unwrap(apiClient.children.assessments(childId)),
    enabled: !!childId,
  });

  const kpspList = useMemo(() => assessments.filter((a) => a.type === 'kpsp'), [assessments]);
  const clinicalList = useMemo(
    () => assessments.filter((a) => a.type === 'clinical'),
    [assessments],
  );

  // Tren skor KPSP (kronologis). Fallback ke data contoh bila < 2 titik.
  const kpspTrend = useMemo(() => {
    const real = [...kpspList]
      .reverse()
      .map((a) => ({
        label: shortDate(a.assessed_at),
        score: a.score ?? 0,
        max: a.max_score ?? 10,
      }));
    return real.length >= 2 ? real : DUMMY_KPSP;
  }, [kpspList]);
  const kpspIsDummy = kpspList.length < 2;

  // Radar domain dari penilaian klinis terbaru. Fallback ke data contoh.
  const radarData = useMemo(() => {
    const latest = clinicalList[0];
    if (!latest?.domain_scores) return DUMMY_RADAR;
    try {
      const scores = JSON.parse(latest.domain_scores) as Record<string, number>;
      return DOMAINS.map((d) => ({ domain: DOMAIN_LABEL[d], skor: scores[d] ?? 0 }));
    } catch {
      return DUMMY_RADAR;
    }
  }, [clinicalList]);
  const radarIsDummy = clinicalList.length === 0;

  const latestKPSP = kpspList[0];

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Penilaian Perkembangan (KPSP)
            </CardTitle>
            <CardDescription>
              Skrining mandiri perkembangan anak berbasis KPSP Kemenkes + grafik tren
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                // Nama anak TIDAK dimasukkan ke URL (data pribadi — UU PDP); halaman
                // Denver mengambil nama dari childId setelah verifikasi kepemilikan.
                navigate({ to: `/skrining-denver?child=${childId}&age=${ageInMonths(dateOfBirth)}` })
              }
            >
              <ShieldAlert className="h-4 w-4 mr-2" />
              Skrining Denver
            </Button>
            <Button size="sm" onClick={() => setKpspOpen(true)}>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Skrining KPSP
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hasil terakhir */}
        {latestKPSP && (
          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-600">Hasil skrining terakhir:</span>
              <span className="font-semibold text-gray-900">
                {latestKPSP.score}/{latestKPSP.max_score}
              </span>
              {latestKPSP.interpretation && (
                <Badge className={safeInterp(latestKPSP.interpretation).className}>
                  {safeInterp(latestKPSP.interpretation).label}
                </Badge>
              )}
              <span className="text-sm text-gray-500">· usia {latestKPSP.age_month} bln · {shortDate(latestKPSP.assessed_at)}</span>
            </div>
            {latestKPSP.interpretation && latestKPSP.interpretation !== 'sesuai' && (
              <LangkahSelanjutnya
                interp={latestKPSP.interpretation}
                weakDomain={weakestDomain(latestKPSP.answers)}
                assessmentId={latestKPSP.id}
                childId={childId}
              />
            )}
          </div>
        )}

        {/* Grafik tren KPSP */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LineIcon className="h-4 w-4 text-gray-500" />
            <h4 className="text-sm font-medium text-gray-900">Tren Skor KPSP</h4>
            {kpspIsDummy && (
              <Badge variant="secondary" className="text-[10px]">contoh</Badge>
            )}
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kpspTrend} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis domain={[0, 10]} fontSize={11} />
                <Tooltip />
                <ReferenceLine y={9} stroke="#16a34a" strokeDasharray="4 4" label={{ value: 'Sesuai', fontSize: 10, fill: '#16a34a', position: 'right' }} />
                <ReferenceLine y={7} stroke="#ca8a04" strokeDasharray="4 4" label={{ value: 'Meragukan', fontSize: 10, fill: '#ca8a04', position: 'right' }} />
                <Line type="monotone" dataKey="score" name="Skor 'Ya'" stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar domain (penilaian klinis terapis) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-gray-500" />
            <h4 className="text-sm font-medium text-gray-900">Profil Domain Perkembangan</h4>
            {radarIsDummy && (
              <Badge variant="secondary" className="text-[10px]">contoh</Badge>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid />
                <PolarAngleAxis dataKey="domain" fontSize={11} />
                <PolarRadiusAxis domain={[0, 100]} fontSize={10} />
                <Radar name="Skor" dataKey="skor" stroke="#0d9488" fill="#0d9488" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {radarIsDummy && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <Info className="h-3 w-3" />
              Data contoh — akan terisi otomatis saat terapis mengisi penilaian klinis.
            </p>
          )}
        </div>

        {/* Riwayat skrining KPSP */}
        {kpspList.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Riwayat Skrining</h4>
            <div className="space-y-2">
              {kpspList.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                  <span className="text-gray-500">{shortDate(a.assessed_at)}</span>
                  <span className="font-medium text-gray-900">{a.score}/{a.max_score}</span>
                  {a.interpretation && (
                    <Badge className={safeInterp(a.interpretation).className}>
                      {safeInterp(a.interpretation).label}
                    </Badge>
                  )}
                  <span className="ml-auto text-gray-500">usia {a.age_month} bln</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {loading && <p className="text-sm text-gray-500">Memuat penilaian...</p>}
      </CardContent>

      <KPSPDialog
        open={kpspOpen}
        onClose={() => setKpspOpen(false)}
        childId={childId}
        childName={childName}
        ageMonth={ageInMonths(dateOfBirth)}
        onDone={() => setKpspOpen(false)}
      />
    </Card>
  );
}

function KPSPDialog({
  open,
  onClose,
  childId,
  childName,
  ageMonth,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  childId: string;
  childName: string;
  ageMonth: number;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [result, setResult] = useState<{ id?: string; score: number; max: number; interp: AssessmentInterpretation; weakDomain: KPSPDomain | null } | null>(null);

  const { data: set, isLoading: loading } = useQuery({
    queryKey: qk.tumbuhKembang.of('kpsp-questions', { ageMonth }),
    queryFn: () => unwrap(apiClient.children.kpspQuestions(ageMonth)),
    enabled: open && ageMonth > 0,
    // Set pertanyaan KPSP per interval usia bersifat statis.
    staleTime: 30 * 60 * 1000,
  });

  // Dialog dibuka ulang selalu mulai dari kondisi kosong.
  useEffect(() => {
    if (!open) return;
    setAnswers({});
    setResult(null);
  }, [open, ageMonth]);

  const allAnswered = set ? set.questions.every((q) => answers[q.no] !== undefined) : false;

  const { mutate: submitKPSP, isPending: saving } = useMutation({
    mutationFn: async () => {
      if (!set) throw new Error('Set KPSP belum siap');
      const payload: KPSPAnswer[] = set.questions.map((q) => ({
        ...q,
        ya: answers[q.no] === true,
      }));
      const saved = await unwrap(
        apiClient.children.submitKPSP(childId, {
          age_month: set.age_month,
          answers: payload,
        })
      );
      if (!saved) throw new Error('Gagal menyimpan');
      return {
        id: saved.id,
        score: saved.score ?? 0,
        max: saved.max_score ?? payload.length,
        interp: (saved.interpretation as AssessmentInterpretation) ?? 'sesuai',
        weakDomain: weakestDomain(JSON.stringify(payload)),
      };
    },
    onSuccess: (saved) => {
      setResult(saved);
      // Riwayat & grafik di kartu induk ikut segar tanpa menunggu tombol "Selesai".
      qc.invalidateQueries({ queryKey: qk.children.sub(childId, 'assessments') });
    },
    onError: (e: Error) => {
      toast({ title: 'Gagal', description: e.message || 'Gagal menyimpan skrining', variant: 'destructive' });
    },
  });

  const handleSubmit = () => submitKPSP();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Skrining KPSP — {childName}</DialogTitle>
          <DialogDescription>
            Jawab sesuai kondisi anak saat ini. Skrining ini bukan diagnosis; hasil meragukan/perlu
            perhatian sebaiknya dikonsultasikan ke terapis atau dokter.
          </DialogDescription>
        </DialogHeader>

        {ageMonth <= 0 ? (
          <p className="text-sm text-gray-600 py-6">
            Tanggal lahir anak belum diisi. Lengkapi tanggal lahir agar set KPSP sesuai usia dapat ditampilkan.
          </p>
        ) : loading ? (
          <p className="text-sm text-gray-500 py-6">Memuat pertanyaan...</p>
        ) : !set ? (
          <p className="text-sm text-gray-600 py-6">Belum ada set KPSP untuk usia ini.</p>
        ) : result ? (
          <div className="py-4 text-center space-y-3">
            <p className="text-3xl font-bold text-gray-900">{result.score}/{result.max}</p>
            <Badge className={safeInterp(result.interp).className}>{safeInterp(result.interp).label}</Badge>
            <p className="text-sm text-gray-600">
              {result.interp === 'sesuai' && 'Perkembangan anak sesuai dengan usianya. Lanjutkan stimulasi rutin.'}
              {result.interp === 'meragukan' && 'Perlu evaluasi ulang. Tingkatkan stimulasi dan skrining ulang dalam 2 minggu.'}
              {result.interp === 'penyimpangan' && 'Sebaiknya segera konsultasikan ke terapis atau dokter tumbuh kembang.'}
            </p>

            {/* Langkah selanjutnya — wire hasil skrining ke tindakan (Fase 4a) */}
            <LangkahSelanjutnya
              interp={result.interp}
              weakDomain={result.weakDomain}
              assessmentId={result.id}
              childId={childId}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Set usia {set.label} · {set.questions.length} pertanyaan</p>
            {set.questions.map((q) => (
              <div key={q.no} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">{q.no}.</span> {q.text}
                  </p>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.no]: true }))}
                    className={`flex-1 rounded-md border px-3 py-1.5 text-sm ${answers[q.no] === true ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700'}`}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.no]: false }))}
                    className={`flex-1 rounded-md border px-3 py-1.5 text-sm ${answers[q.no] === false ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-700'}`}
                  >
                    Tidak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={onDone}>Selesai</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Batal</Button>
              {set && ageMonth > 0 && (
                <Button onClick={handleSubmit} disabled={!allAnswered || saving}>
                  {saving ? 'Menyimpan...' : 'Lihat Hasil'}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


import React, { Suspense, useEffect, useState } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Stethoscope } from 'lucide-react';
import { metaFrom } from '@/lib/seo/head';
import { env } from '@/lib/env';

const metadata = {
  title: 'Konsultasi Tumbuh Kembang Anak dengan Terapis',
  description:
    'Ceritakan keluhan tumbuh kembang anak Anda dan dapatkan sesi konsultasi dengan terapis. Isi intake singkat, sisanya kami yang atur.',
  keywords: [
    'konsultasi tumbuh kembang',
    'konsultasi terapis anak',
    'konsultasi online disabilitas',
  ],
  openGraph: {
    title: 'Konsultasi dengan Terapis | DisabilitasKu',
    description: 'Mulai konsultasi tumbuh kembang anak dengan terapis DisabilitasKu.',
    url: `${env.siteUrl}/konsultasi/mulai`,
  },
};

export const Route = createFileRoute('/_public/konsultasi/mulai/')({
  head: () => {
    const head = metaFrom(metadata);
    return {
      ...head,
      links: [...head.links, { rel: 'canonical', href: `${env.siteUrl}/konsultasi/mulai` }],
    };
  },
  // Intake bisa dimasuki dari hasil skrining (`?assessment=`) atau dari kartu
  // anak (`?child=`); keduanya opsional.
  validateSearch: (search: Record<string, unknown>): { assessment?: string; child?: string } => ({
    assessment: typeof search.assessment === 'string' ? search.assessment : undefined,
    child: typeof search.child === 'string' ? search.child : undefined,
  }),
  component: KonsultasiMulaiPage,
});


// Keluhan umum tumbuh kembang — pilihan cepat supaya ortu tak menatap
// textarea kosong. Bebas menambah lewat "keluhan lain".
const KELUHAN_UMUM = [
  'Belum bisa/terlambat bicara',
  'Sulit fokus & mudah teralihkan',
  'Belum bisa berjalan/duduk sesuai usia',
  'Sulit berinteraksi dengan anak lain',
  'Sering tantrum atau sulit ditenangkan',
  'Kesulitan makan atau mengunyah',
  'Gerakan berulang yang tidak biasa',
  'Belum merespons saat dipanggil',
];

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

function KonsultasiMulaiInner() {
  const navigate = useNavigate();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const { assessment: assessmentId, child: childFromUrl } = Route.useSearch();

  const [pickedChildId, setPickedChildId] = useState<string | undefined>(childFromUrl);
  const [selected, setSelected] = useState<string[]>([]);
  const [otherComplaint, setOtherComplaint] = useState('');
  const [mainConcern, setMainConcern] = useState('');
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate({ to: '/auth', search: { redirect: '/konsultasi/mulai' } });
  }, [authLoading, isAuthenticated, navigate]);

  const { data: children = [] } = useQuery({
    queryKey: qk.children.list(),
    queryFn: () => unwrap(apiClient.children.list()),
    enabled: !authLoading && isAuthenticated,
  });

  // Kalau ortu hanya punya satu anak, tak perlu memilih apa pun.
  const childId = pickedChildId ?? (children.length === 1 ? children[0].id : undefined);

  const toggle = (k: string) =>
    setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  const { mutate: createConsultation, isPending: submitting } = useMutation({
    mutationFn: (complaints: string[]) =>
      unwrap(
        apiClient.consultations.create({
          child_id: childId,
          assessment_id: assessmentId,
          complaints,
          main_concern: mainConcern.trim(),
          consent_pdp: true,
        })
      ),
    onSuccess: (data) => {
      const { consultation_id, redirect_url } = data;
      // Gateway riil memberi URL absolut; mock memberi path internal.
      if (redirect_url?.startsWith('http')) {
        window.location.href = redirect_url;
      } else {
        navigate({ to: redirect_url || `/konsultasi/bayar/${consultation_id}` });
      }
    },
    onError: (e: Error) => {
      toast({ title: 'Gagal', description: e.message || 'Gagal membuat konsultasi', variant: 'destructive' });
    },
  });

  const handleSubmit = () => {
    if (!consent) {
      toast({ title: 'Persetujuan diperlukan', description: 'Centang persetujuan pemrosesan data untuk lanjut.', variant: 'destructive' });
      return;
    }
    if (!mainConcern.trim()) {
      toast({ title: 'Belum lengkap', description: 'Isi kekhawatiran utama Anda.', variant: 'destructive' });
      return;
    }
    const complaints = [...selected];
    otherComplaint
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => complaints.push(s));

    createConsultation(complaints);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
          <Stethoscope className="h-6 w-6 text-teal-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Konsultasi bahas hasil skrining</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          Sesi singkat {formatRupiah(50000)} bersama konsultan mitra untuk membahas hasil skrining dan
          menentukan arah terapi yang tepat. Isi keluhan dulu agar sesi langsung tepat sasaran.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 py-6">
          {children.length > 0 && (
            <div className="space-y-2">
              <Label>Anak yang dikonsultasikan</Label>
              <div className="flex flex-wrap gap-2">
                {children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setPickedChildId(c.id)}
                    className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                      childId === c.id
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300'
                    }`}
                  >
                    {c.full_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Keluhan yang dirasakan (boleh lebih dari satu)</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {KELUHAN_UMUM.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggle(k)}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                    selected.includes(k)
                      ? 'border-teal-600 bg-teal-50 text-teal-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="other">Keluhan lain (satu per baris, opsional)</Label>
            <Textarea
              id="other"
              rows={3}
              value={otherComplaint}
              onChange={(e) => setOtherComplaint(e.target.value)}
              placeholder="Contoh: sering terbangun malam hari"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="main">Kekhawatiran utama Anda</Label>
            <Textarea
              id="main"
              rows={4}
              value={mainConcern}
              onChange={(e) => setMainConcern(e.target.value)}
              placeholder="Ceritakan singkat apa yang paling Anda khawatirkan dan sejak kapan."
            />
          </div>

          {assessmentId && (
            <p className="rounded-lg border border-teal-100 bg-teal-50/60 p-3 text-xs text-gray-600">
              Hasil skrining terakhir akan dilampirkan otomatis ke sesi ini.
            </p>
          )}

          <label className="flex items-start gap-2.5 rounded-lg border bg-gray-50 p-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-teal-600"
            />
            <span className="text-xs text-gray-600">
              Saya setuju keluhan dan hasil skrining ini diproses serta dibagikan kepada konsultan mitra
              yang menangani sesi saya, sesuai{' '}
              <Link to="/keamanan" className="font-medium text-teal-700 hover:underline">
                kebijakan perlindungan data
              </Link>
              . Data kesehatan hanya dapat dilihat oleh Anda dan konsultan tersebut.
            </span>
          </label>

          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <div>
              <p className="text-xs text-gray-500">Biaya sesi</p>
              <p className="text-lg font-bold text-gray-900">{formatRupiah(50000)}</p>
            </div>
            <Button onClick={handleSubmit} disabled={submitting || !consent}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                </>
              ) : (
                'Lanjut ke pembayaran'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-[11px] text-gray-500">
        Konsultasi ini membantu mengarahkan langkah berikutnya — bukan pengganti diagnosis dokter.
      </p>
      <p className="mt-2 text-center text-xs">
        <Link to="/konsultasi/riwayat" className="font-medium text-teal-700 hover:underline">
          Lihat konsultasi saya
        </Link>
      </p>
    </div>
  );
}

function KonsultasiMulaiPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-gray-500">Memuat...</div>}
    >
      <KonsultasiMulaiInner />
    </Suspense>
  );
}

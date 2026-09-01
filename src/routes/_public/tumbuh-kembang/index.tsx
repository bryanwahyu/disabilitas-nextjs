
import { useState, useMemo } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { MilestoneSet } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Baby, CheckCircle2, AlertTriangle, Info, Stethoscope,
  ClipboardCheck, Loader2, ArrowRight, Lightbulb, Heart, ShieldAlert,
} from 'lucide-react';
import { metaFrom } from '@/lib/seo/head';
import { env } from '@/lib/env';

const metadata = {
  title: 'Tumbuh Kembang Anak — Milestone & Deteksi Dini',
  description:
    'Kenali tahap tumbuh kembang anak per usia dan tanda yang perlu diperiksa lebih lanjut. Panduan milestone dan skrining awal untuk orang tua.',
  keywords: [
    'tumbuh kembang anak',
    'milestone anak',
    'deteksi dini keterlambatan',
    'skrining tumbuh kembang',
    'perkembangan anak per usia',
  ],
  openGraph: {
    title: 'Tumbuh Kembang Anak — Milestone & Deteksi Dini | DisabilitasKu',
    description:
      'Panduan milestone tumbuh kembang anak per usia dan langkah bila ada keterlambatan.',
    url: `${env.siteUrl}/tumbuh-kembang`,
  },
};

// Kategori artikel yang diisi/dikurasi lewat CMS admin.
const CAT_STIMULASI = 'stimulasi-dini';
const CAT_KISAH = 'kisah-orang-tua';

/*
 * Opsi query dipakai dua kali: di `loader` (jalan saat SSR) dan di `useQuery`
 * komponen. Kunci dan `queryFn`-nya harus persis sama supaya hasil loader
 * terpakai, bukan memicu request kedua setelah hidrasi.
 */
const milestoneAgesQuery = {
  queryKey: qk.tumbuhKembang.of('milestone-ages'),
  queryFn: () => unwrap(apiClient.publicTumbuhKembang.milestones()),
  staleTime: 30 * 60 * 1000,
};

const stimulasiQuery = {
  queryKey: qk.articles.list({ category: CAT_STIMULASI, limit: 4 }),
  queryFn: () => unwrap(apiClient.publicArticles.list({ category: CAT_STIMULASI, limit: 4 })),
};

const kisahQuery = {
  queryKey: qk.articles.list({ category: CAT_KISAH, limit: 3 }),
  queryFn: () => unwrap(apiClient.publicArticles.list({ category: CAT_KISAH, limit: 3 })),
};

export const Route = createFileRoute('/_public/tumbuh-kembang/')({
  head: () => {
    const head = metaFrom(metadata);
    return { ...head, links: [...head.links, { rel: 'canonical', href: `${env.siteUrl}/tumbuh-kembang` }] };
  },

  /*
   * Halaman ini pintu masuk publik deteksi dini — target pencarian "milestone
   * anak" / "tumbuh kembang usia N bulan". Tanpa loader, HTML awal dikirim
   * tanpa satu pun interval usia dan tanpa konten stimulasi: crawler cuma
   * melihat kerangka kosong.
   *
   * Daftar usia dan dua daftar artikel diambil di server. Detail milestone per
   * usia TIDAK ikut — pilihannya interaksi pengunjung (`enabled: !!selectedAge`),
   * jadi tak ada satu jawaban yang benar untuk dirender di server.
   *
   * Kegagalan salah satu tidak boleh menjatuhkan halaman: konten CMS
   * `stimulasi-dini`/`kisah-orang-tua` sampai hari ini masih kosong, dan
   * panduan milestone tetap berguna tanpa keduanya.
   */
  loader: async ({ context }) => {
    await Promise.allSettled([
      context.queryClient.ensureQueryData(milestoneAgesQuery),
      context.queryClient.ensureQueryData(stimulasiQuery),
      context.queryClient.ensureQueryData(kisahQuery),
    ]);
  },

  component: TumbuhKembangPage,
});

// Label ramah untuk tiap interval usia (bulan → teks).
function ageLabel(m: number): string {
  if (m < 12) return `${m} bln`;
  const y = m / 12;
  return Number.isInteger(y) ? `${y} th` : `${m} bln`;
}

function TumbuhKembangPage() {
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  // Item "biasanya bisa" yang ditandai ortu SUDAH bisa dilakukan anak.
  const [done, setDone] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);

  // Daftar interval usia praktis tidak pernah berubah. Sudah diisi loader.
  const { data: ages = [] } = useQuery({
    ...milestoneAgesQuery,
    select: (data) => (data as { ages?: number[] }).ages ?? [],
  });

  // Konten "sambil menunggu": panduan stimulasi + kisah orang tua (dikurasi via CMS).
  const { data: stimulasi = [] } = useQuery(stimulasiQuery);

  const { data: kisah = [] } = useQuery(kisahQuery);

  const { data: set = null, isLoading: loading } = useQuery({
    queryKey: qk.tumbuhKembang.detail(selectedAge ?? ''),
    queryFn: () => unwrap(apiClient.publicTumbuhKembang.milestones(selectedAge!)),
    select: (data) => (data as MilestoneSet) || null,
    enabled: !!selectedAge,
  });

  // Ganti usia = mulai dari nol: centang dan ringkasan sebelumnya tidak relevan lagi.
  const pickAge = (age: number) => {
    setSelectedAge(age);
    setDone(new Set());
    setShowResult(false);
  };

  const allCanItems = useMemo(
    () => (set ? set.domains.flatMap((d) => d.can.map((c) => `${d.domain}::${c}`)) : []),
    [set]
  );
  const missingCount = allCanItems.length - done.size;
  const perluPerhatian = missingCount > 0;

  const toggle = (key: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
          <Baby className="h-6 w-6 text-teal-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Kenali Tumbuh Kembang Anak</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
          Panduan sederhana untuk mengenali apa yang biasanya sudah bisa dilakukan anak di tiap usia —
          dan apa yang perlu diperhatikan. Semakin dini dikenali, semakin baik peluang tumbuh kembangnya.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          Panduan ini <strong>bukan diagnosis</strong>. Tiap anak berkembang dengan ritmenya sendiri.
          Bila ada yang perlu diperhatikan, langkah selanjutnya adalah skrining terarah atau konsultasi —
          bukan label.
        </p>
      </div>

      {/* Pemilih usia */}
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-gray-700">Pilih usia anak:</p>
        <div className="flex flex-wrap gap-2">
          {ages.map((a) => (
            <button
              key={a}
              onClick={() => pickAge(a)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                selectedAge === a
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-teal-400'
              }`}
            >
              {ageLabel(a)}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-10 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {!loading && set && (
        <>
          <p className="mb-3 text-sm text-gray-500">
            Tandai hal yang <strong>sudah bisa</strong> dilakukan anak Anda di usia {set.label}.
          </p>

          <div className="space-y-4">
            {set.domains.map((d) => (
              <Card key={d.domain}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{d.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    {d.can.map((c) => {
                      const key = `${d.domain}::${c}`;
                      const checked = done.has(key);
                      return (
                        <button
                          key={key}
                          onClick={() => toggle(key)}
                          className="flex w-full items-start gap-2 rounded-md p-1.5 text-left text-sm hover:bg-gray-50"
                        >
                          <CheckCircle2
                            className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                              checked ? 'text-teal-600' : 'text-gray-300'
                            }`}
                          />
                          <span className={checked ? 'text-gray-900' : 'text-gray-600'}>{c}</span>
                        </button>
                      );
                    })}
                  </div>
                  {d.flags.length > 0 && (
                    <div className="rounded-md bg-red-50 p-2.5">
                      <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-red-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> Perlu diperhatikan bila
                      </p>
                      <ul className="list-inside list-disc space-y-0.5 text-xs text-red-700/90">
                        {d.flags.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Button onClick={() => setShowResult(true)}>Lihat ringkasan</Button>
          </div>

          {/* Ringkasan + langkah selanjutnya */}
          {showResult && (
            <Card className="mt-6 border-2">
              <CardContent className="space-y-3 py-5 text-center">
                {perluPerhatian ? (
                  <>
                    <Badge className="bg-yellow-100 text-yellow-800">Ada yang perlu diperhatikan</Badge>
                    <p className="text-sm text-gray-600">
                      Ada {missingCount} hal yang biasanya sudah bisa dilakukan di usia ini namun belum
                      Anda tandai. Ini belum tentu masalah — tapi baik untuk ditindaklanjuti lebih awal.
                    </p>
                    <div className="mx-auto max-w-sm space-y-2 pt-2 text-left">
                      <p className="text-xs font-semibold text-gray-700">Langkah selanjutnya</p>
                      <Link
                        to="/skrining-denver"
                        search={selectedAge ? { age: selectedAge } : {}}
                        className="flex w-full items-center justify-between rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4" /> Skrining Denver II (tanpa daftar)
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        to="/auth"
                        className="flex items-center justify-between rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
                      >
                        <span className="flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4" /> Daftar & jalankan skrining KPSP resmi
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        to="/rekomendasi"
                        className="flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <span className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" /> Cari terapis terdekat
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <Badge className="bg-green-100 text-green-800">Sesuai tahapan usia</Badge>
                    <p className="text-sm text-gray-600">
                      Anak Anda tampak berkembang sesuai usianya. Lanjutkan stimulasi rutin dan periksa
                      kembali di usia berikutnya.
                    </p>
                    <div className="pt-2">
                      <Link to="/auth" className="text-sm font-medium text-teal-600 hover:underline">
                        Buat profil anak untuk pantau perkembangan berkala →
                      </Link>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Stimulasi sambil menunggu (anchor dari hasil KPSP — Fase 4c) */}
      <div id="stimulasi" className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-teal-600" />
          <h2 className="text-base font-semibold text-gray-800">Stimulasi di rumah</h2>
        </div>
        <p className="mb-3 text-sm text-gray-600">
          Sambil menunggu jadwal pemeriksaan, stimulasi harian sederhana tetap membantu tumbuh
          kembang anak.
        </p>
        {stimulasi.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {stimulasi.map((a) => (
              <Link
                key={a.id}
                to="/artikel/$slug" params={{ slug: a.slug }}
                className="rounded-lg border p-3 transition-colors hover:border-teal-400 hover:bg-teal-50/40"
              >
                <p className="text-sm font-medium text-gray-900">{a.title}</p>
                {a.excerpt && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">{a.excerpt}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
            Panduan stimulasi sedang disiapkan. Sementara itu, jelajahi{' '}
            <Link to="/artikel" className="font-medium text-teal-600 hover:underline">
              artikel & panduan
            </Link>{' '}
            lainnya.
          </div>
        )}
      </div>

      {/* Kisah orang tua — narasi positif, dikurasi (Fase 4c) */}
      {kisah.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" />
            <h2 className="text-base font-semibold text-gray-800">Cerita orang tua</h2>
          </div>
          <div className="space-y-3">
            {kisah.map((a) => (
              <Link
                key={a.id}
                to="/artikel/$slug" params={{ slug: a.slug }}
                className="block rounded-lg border p-3 transition-colors hover:border-rose-300 hover:bg-rose-50/40"
              >
                <p className="text-sm font-medium text-gray-900">{a.title}</p>
                {a.excerpt && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">{a.excerpt}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


import { useState, useCallback, useEffect } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { RecommendedLocation } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MapPin, Navigation, Star, Loader2, Building2,
  AlertCircle, RefreshCw, Sparkles, LocateFixed,
  Chrome, Globe, Settings,
} from 'lucide-react';
import { metaFrom } from '@/lib/seo/head';
import { env } from '@/lib/env';

const metadata = {
  title: 'Rekomendasi Lokasi Terapi Terdekat',
  description:
    'Dapatkan rekomendasi lokasi terapi yang sesuai kebutuhan dan lokasi Anda, berdasarkan layanan yang tersedia dan jarak.',
  keywords: ['rekomendasi terapi', 'lokasi terapi terdekat', 'klinik terapi anak'],
  openGraph: {
    title: 'Rekomendasi Lokasi Terapi | DisabilitasKu',
    description: 'Rekomendasi lokasi terapi yang sesuai kebutuhan dan lokasi Anda.',
    url: `${env.siteUrl}/rekomendasi`,
  },
};

export const Route = createFileRoute('/_public/rekomendasi/')({
  head: () => {
    const head = metaFrom(metadata);
    return { ...head, links: [...head.links, { rel: 'canonical', href: `${env.siteUrl}/rekomendasi` }] };
  },
  component: RekomendasiPage,
});


// ─── helpers ──────────────────────────────────────────────────────────────────

function formatKm(km: number): string {
  if (km < 0) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function renderStars(score: number) {
  const filled = Math.min(5, Math.round(Number(score) || 0));
  return (
    <span className="flex items-center gap-0.5" aria-label={`Skor ${score}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13}
          className={i < filled ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </span>
  );
}

// ─── skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-8 bg-gray-100 rounded w-full mt-3" />
      </div>
    </div>
  );
}

// ─── card ──────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  yayasan: 'Yayasan',
  klinik: 'Klinik',
  rumah_sakit: 'Rumah Sakit',
  praktek_mandiri: 'Praktek Mandiri',
  puskesmas: 'Puskesmas',
  lainnya: 'Lainnya',
};

function RecommendCard({ item, index }: { item: RecommendedLocation; index: number }) {
  const typeLabel = item.type ? (TYPE_LABELS[item.type] ?? item.type) : null;

  return (
    <Card className="hover:shadow-md transition-shadow border border-gray-100">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">#{item.rank ?? index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
              {item.name || 'Lokasi Terapi'}
            </CardTitle>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {typeLabel && (
                <span className="text-xs text-primary font-medium">{typeLabel}</span>
              )}
              {item.city_name && (
                <span className="text-xs text-gray-500">· {item.city_name}</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div className="flex items-center text-sm text-gray-600 gap-2">
          <Navigation size={14} className="text-primary flex-shrink-0" />
          <span className="font-medium">{formatKm(item.distance_km)}</span>
          <span className="text-gray-500">dari posisi Anda</span>
        </div>
        <div className="flex items-center gap-2">
          {renderStars(item.predicted_rating)}
          <span className="text-xs text-gray-500">prediksi {Number(item.predicted_rating).toFixed(1)}</span>
          <span className="ml-auto">
            <Badge variant="secondary" className="text-xs">
              Skor {Number(item.score).toFixed(1)}
            </Badge>
          </span>
        </div>
        {/* ⚠️ `/lokasi-terapi/:id` sudah tidak punya halaman — sudah begitu
            sejak sebelum migrasi ini (nav lokasi terapi dipangkas, route-nya
            ikut hilang), jadi tombol ini memang 404. Dibiarkan sebagai <a>
            supaya perilakunya tidak diam-diam berubah; perbaikannya butuh
            keputusan produk: buat lagi halaman detail lokasi, atau arahkan ke
            daftar terapis. */}
        <a href={`/lokasi-terapi/${item.id}`} className="block">
          <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5 text-sm mt-1">
            <Building2 size={14} className="mr-1.5" />
            Lihat Detail
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}

// ─── pre-prompt screen ─────────────────────────────────────────────────────────

function PrePromptScreen({ onAllow, onSkip }: { onAllow: () => void; onSkip: () => void }) {
  return (
    <div className="max-w-sm mx-auto text-center py-12 px-4">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <LocateFixed size={36} className="text-primary" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-3">
        Izinkan akses lokasi Anda
      </h2>
      <p className="text-gray-600 text-sm mb-2">
        Kami menggunakan posisi Anda <strong>hanya untuk menghitung jarak</strong> ke lokasi terapi terdekat. Data ini tidak disimpan.
      </p>
      <p className="text-gray-500 text-xs mb-8">
        Setelah klik <em>Aktifkan Lokasi</em>, browser akan menampilkan dialog izin. Pilih <strong>"Izinkan"</strong> untuk hasil terbaik.
      </p>
      <div className="space-y-3">
        <Button
          className="w-full bg-primary text-white hover:bg-primary/90"
          onClick={onAllow}
        >
          <LocateFixed size={16} className="mr-2" />
          Aktifkan Lokasi
        </Button>
        <button
          onClick={onSkip}
          className="w-full text-sm text-gray-500 hover:text-gray-600 transition-colors py-2"
        >
          Lewati — tampilkan berdasarkan rating saja
        </button>
      </div>
    </div>
  );
}

// ─── denied screen ─────────────────────────────────────────────────────────────

function DeniedScreen({ onRetry, onManual }: {
  onRetry: () => void;
  onManual: (lat: number, lng: number) => void;
}) {
  const [showManual, setShowManual] = useState(false);
  const [latStr, setLatStr] = useState('');
  const [lngStr, setLngStr] = useState('');
  const [err, setErr] = useState('');

  function submitManual() {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setErr('Koordinat tidak valid. Contoh: lat -6.2, lng 106.8');
      return;
    }
    onManual(lat, lng);
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={28} className="text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Akses lokasi ditolak</h2>
        <p className="text-sm text-gray-500">
          Browser memblokir akses lokasi. Aktifkan kembali melalui pengaturan browser, atau masukkan koordinat secara manual.
        </p>
      </div>

      {/* Panduan per browser */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-6 space-y-3">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Cara re-enable lokasi</p>
        <div className="flex items-start gap-3">
          <Chrome size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-600">
            <span className="font-medium">Chrome/Edge:</span> Klik ikon gembok di address bar → <em>Izin situs</em> → Lokasi → <em>Izinkan</em>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Globe size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-600">
            <span className="font-medium">Firefox:</span> Klik ikon gembok → <em>Hapus izin</em> → muat ulang → izinkan
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Settings size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-600">
            <span className="font-medium">Safari (iOS):</span> Pengaturan → Safari → Lokasi → <em>Izinkan</em>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button variant="outline" className="w-full border-primary text-primary" onClick={onRetry}>
          <RefreshCw size={14} className="mr-2" />
          Coba lagi setelah mengubah izin
        </Button>

        <button
          onClick={() => setShowManual(v => !v)}
          className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors py-1"
        >
          {showManual ? 'Sembunyikan' : 'Masukkan koordinat manual'}
        </button>

        {showManual && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-xs text-gray-500">
              Cari koordinat Anda di <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Maps</a> → klik kanan lokasi → salin angka pertama (lat) dan kedua (lng).
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="rekomendasi-lat" className="text-xs text-gray-600 font-medium">Latitude</label>
                <Input id="rekomendasi-lat" placeholder="-6.2088" value={latStr} onChange={e => setLatStr(e.target.value)} className="mt-1 text-sm" />
              </div>
              <div>
                <label htmlFor="rekomendasi-lng" className="text-xs text-gray-600 font-medium">Longitude</label>
                <Input id="rekomendasi-lng" placeholder="106.8456" value={lngStr} onChange={e => setLngStr(e.target.value)} className="mt-1 text-sm" />
              </div>
            </div>
            {err && <p className="text-xs text-red-500">{err}</p>}
            <Button className="w-full bg-primary text-white text-sm" onClick={submitManual}>
              Tampilkan Rekomendasi
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────────

type Screen = 'pre-prompt' | 'requesting' | 'denied' | 'results';

function RekomendasiPage() {
  const [screen, setScreen] = useState<Screen>('pre-prompt');
  // Null = belum ada permintaan; objek kosong = minta tanpa koordinat (dilewati).
  const [request, setRequest] = useState<{ lat?: number; lng?: number } | null>(null);

  const coords =
    request?.lat != null && request?.lng != null
      ? { lat: request.lat, lng: request.lng }
      : null;

  const {
    data: items = [],
    isPending: loading,
    error: queryError,
  } = useQuery({
    queryKey: qk.locations.of('recommendations', request ?? {}),
    queryFn: () =>
      unwrap(apiClient.public.recommendations.locations({ ...request, limit: 12 })),
    enabled: request !== null,
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Gagal memuat rekomendasi'
    : null;

  const fetchRecommendations = useCallback((lat?: number, lng?: number) => {
    setRequest({ lat, lng });
    setScreen('results');
  }, []);

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      fetchRecommendations();
      return;
    }
    setScreen('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchRecommendations(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setScreen('denied');
      },
      { timeout: 10000 }
    );
  }, [fetchRecommendations]);

  // Cek status permission saat mount — kalau sudah granted, langsung ambil lokasi
  useEffect(() => {
    if (!navigator.permissions) return;
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        requestGeolocation();
      } else if (result.state === 'denied') {
        setScreen('denied');
      }
      // 'prompt' → tetap tampilkan pre-prompt
    }).catch(() => {
      // browser lama tidak support permissions API, biarkan pre-prompt
    });
  }, [requestGeolocation]);

  // Pre-prompt: user belum pernah memutuskan izin lokasi
  if (screen === 'pre-prompt') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-4">
              <Sparkles size={14} />
              Slope One + Ant Colony
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Rekomendasi <span className="text-primary">Lokasi Terdekat</span>
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              Lokasi terapi dipersonalisasi berdasarkan rating kolaboratif dan jarak terdekat dari posisi Anda.
            </p>
          </div>
          <PrePromptScreen onAllow={requestGeolocation} onSkip={() => fetchRecommendations()} />
        </div>
      </div>
    );
  }

  // Requesting: spinner saat nunggu browser prompt
  if (screen === 'requesting') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Menunggu izin lokasi…</p>
          <p className="text-sm text-gray-500 mt-1">Pilih <strong>"Izinkan"</strong> pada dialog browser</p>
        </div>
      </div>
    );
  }

  // Denied: panduan cara re-enable + input manual
  if (screen === 'denied') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Rekomendasi Lokasi Terapi</h1>
          </div>
          <DeniedScreen
            onRetry={requestGeolocation}
            onManual={(lat, lng) => fetchRecommendations(lat, lng)}
          />
        </div>
      </div>
    );
  }

  // Results screen
  return (
    <div className="py-12 px-4 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            <Sparkles size={14} />
            Slope One + Ant Colony
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Rekomendasi <span className="text-primary">Lokasi Terdekat</span>
          </h1>
        </div>

        {/* location badge */}
        {coords && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-8 flex items-center gap-3">
            <Navigation size={16} className="text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-800">
              Posisi terdeteksi: <span className="font-medium">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
              {' '}— diurutkan berdasarkan jarak + prediksi rating
            </p>
          </div>
        )}

        {error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
            <p className="text-gray-700 font-medium mb-4">{error}</p>
            <Button onClick={() => setScreen('pre-prompt')} variant="outline" className="border-primary text-primary">
              <RefreshCw size={14} className="mr-2" />
              Coba lagi
            </Button>
          </div>
        ) : loading ? (
          <div>
            <p className="text-sm text-gray-500 mb-5">Menghitung rekomendasi…</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Belum ada rekomendasi</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              Belum ada cukup data rating untuk menghasilkan rekomendasi. Mulai ulas lokasi terapi yang pernah Anda kunjungi.
            </p>
            <Link to="/terapis">
              <Button className="bg-primary text-white hover:bg-primary/90">Cari Lokasi Terapi</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{items.length}</span> lokasi direkomendasikan
              </p>
              <button
                onClick={() => setScreen('pre-prompt')}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <RefreshCw size={11} />
                Perbarui lokasi
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item, i) => (
                <RecommendCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


import { useState, useEffect, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, CheckCircle, Loader2,
  Clock, User, Briefcase, DollarSign, Calendar, Building2,
  Stethoscope, Heart, MessageCircle, Video, Home, Lock
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useToast } from '@/hooks/use-toast';
import { env } from '@/lib/env';

const DEFAULT_PROVIDER_FILTERS: ProviderFilters = {
  search: '',
  method: 'all',
  rate: 'all',
  bpjs: false,
};

export const Route = createFileRoute('/_public/terapis/')({
  // Canonical halaman daftar; dipisah dari layout supaya tidak ikut menempel
  // di halaman profil terapis (lihat catatan di route.tsx).
  head: () => ({ links: [{ rel: 'canonical', href: `${env.siteUrl}/terapis` }] }),

  /*
   * Daftar terapis tanpa filter — kondisi awal yang dilihat crawler dan
   * pengunjung pertama kali. Tanpa loader, halaman pencarian terapis (tujuan
   * utama platform) dikirim ke crawler tanpa satu nama pun di dalamnya.
   */
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: qk.therapyProviders.list(DEFAULT_PROVIDER_FILTERS),
      queryFn: () => fetchTherapists(DEFAULT_PROVIDER_FILTERS),
    }),

  component: TerapisPage,
});


interface TherapyProvider {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  city?: string;
  district?: string;
  bio?: string;
  specialization?: string;
  experience_years?: number;
  rate_per_session?: number;
  rate_min?: number;
  rate_max?: number;
  bpjs_accepted?: boolean;
  consultation_methods?: string;
  is_verified?: boolean;
}

interface TherapyLocationPublic {
  id: string;
  name: string;
  type: string | null;
  type_label: string;
  address: string;
  city_name: string | null;
  description: string | null;
  phone: string | null;
  is_verified: boolean;
  bpjs_accepted?: boolean;
  consultation_methods?: string | null;
  rate_min?: number | null;
  rate_max?: number | null;
  services: string[];
  open_hours?: Array<{ day_of_week: number; open_time: string; close_time: string }>;
  contact_locked?: boolean;
}

const PAGE_SIZE = 12;

const locationTypes = [
  { value: 'yayasan', label: 'Yayasan' },
  { value: 'klinik', label: 'Klinik' },
  { value: 'rumah_sakit', label: 'Rumah Sakit' },
  { value: 'praktek_mandiri', label: 'Praktek Mandiri' },
  { value: 'puskesmas', label: 'Puskesmas' },
];

const methodIcons: Record<string, typeof Stethoscope> = {
  'tatap muka': Home,
  'online': Video,
  'chat': MessageCircle,
  'home visit': Home,
  'home_visit': Home,
  'klinik': Building2,
  'offline': Building2,
};

const consultMethods = [
  { value: 'online', label: 'Online' },
  { value: 'home_visit', label: 'Home Visit' },
  { value: 'klinik', label: 'Datang ke Klinik' },
];

const rateOptions = [
  { value: '100000', label: '≤ Rp 100 rb/sesi' },
  { value: '200000', label: '≤ Rp 200 rb/sesi' },
  { value: '300000', label: '≤ Rp 300 rb/sesi' },
  { value: '500000', label: '≤ Rp 500 rb/sesi' },
];

const methodLabels: Record<string, string> = {
  online: 'Online',
  home_visit: 'Home Visit',
  'home visit': 'Home Visit',
  klinik: 'Klinik',
  offline: 'Tatap Muka',
};

function formatRateRange(min?: number | null, max?: number | null, fallback?: number | null): string | null {
  const compact = (n: number) => new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 0 }).format(n);
  if (min && max && min !== max) return `Rp ${compact(min)} – Rp ${compact(max)}`;
  const single = min || max || fallback;
  if (single) return `Rp ${compact(single)}`;
  return null;
}

type TabMode = 'therapists' | 'locations';

const BASE_URL = env.apiBaseUrl;

type ProviderFilters = { search: string; method: string; rate: string; bpjs: boolean };
type LocationFilters = ProviderFilters & { type: string };

async function fetchTherapists(f: ProviderFilters): Promise<TherapyProvider[]> {
  const qs = new URLSearchParams();
  if (f.search) qs.set('q', f.search);
  if (f.method !== 'all') qs.set('method', f.method);
  if (f.rate !== 'all') qs.set('rate_max', f.rate);
  if (f.bpjs) qs.set('bpjs', 'true');
  qs.set('per_page', '50');

  const res = await fetch(`${BASE_URL}/therapy/providers?${qs.toString()}`);
  const json = await res.json();
  const data: TherapyProvider[] = Array.isArray(json.data) ? json.data : [];
  return data.filter((p) => p.role === 'therapist_independent' || p.role === 'therapy');
}

async function fetchLocationsPage(
  f: LocationFilters,
  offset: number
): Promise<{ data: TherapyLocationPublic[]; total: number }> {
  const qs = new URLSearchParams();
  if (f.search) qs.set('search', f.search);
  if (f.type !== 'all') qs.set('type', f.type);
  if (f.method !== 'all') qs.set('method', f.method);
  if (f.rate !== 'all') qs.set('rate_max', f.rate);
  if (f.bpjs) qs.set('bpjs', 'true');
  qs.set('limit', String(PAGE_SIZE));
  qs.set('offset', String(offset));

  const tokenKey = env.authTokenKey;
  const token = typeof window !== 'undefined' ? localStorage.getItem(tokenKey) : null;
  const res = await fetch(`${BASE_URL}/public/therapists?${qs.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const json = await res.json();
  return {
    data: Array.isArray(json.data) ? (json.data as TherapyLocationPublic[]) : [],
    total: json.meta?.total ?? 0,
  };
}

function TerapisPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [maxRate, setMaxRate] = useState('all');
  const [bpjsOnly, setBpjsOnly] = useState(false);
  const [tab, setTab] = useState<TabMode>('therapists');
  const { toast } = useToast();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Ketikan tidak langsung memicu request; filter dropdown berlaku seketika.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const providerFilters: ProviderFilters = {
    search: debouncedSearch,
    method: selectedMethod,
    rate: maxRate,
    bpjs: bpjsOnly,
  };
  const locationFilters: LocationFilters = { ...providerFilters, type: selectedType };

  const therapistsQuery = useQuery({
    queryKey: qk.therapyProviders.list(providerFilters),
    queryFn: () => fetchTherapists(providerFilters),
    enabled: tab === 'therapists',
    placeholderData: keepPreviousData,
  });

  const locationsQuery = useInfiniteQuery({
    queryKey: qk.locations.list(locationFilters),
    queryFn: ({ pageParam }) => fetchLocationsPage(locationFilters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.data.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    enabled: tab === 'locations',
    placeholderData: keepPreviousData,
  });

  const therapists = therapistsQuery.data ?? [];
  const locations = locationsQuery.data?.pages.flatMap((p) => p.data) ?? [];
  const total = tab === 'therapists' ? therapists.length : locationsQuery.data?.pages[0]?.total ?? 0;
  const loading = tab === 'therapists' ? therapistsQuery.isLoading : locationsQuery.isLoading;
  const loadingMore = locationsQuery.isFetchingNextPage;
  const hasMore = tab === 'locations' ? locationsQuery.hasNextPage : false;

  const therapistsError = therapistsQuery.error;
  useEffect(() => {
    if (therapistsError) {
      toast({ title: 'Error', description: 'Gagal memuat data terapis', variant: 'destructive' });
    }
  }, [therapistsError, toast]);

  const locationsError = locationsQuery.error;
  useEffect(() => {
    if (locationsError) {
      toast({ title: 'Error', description: 'Gagal memuat data', variant: 'destructive' });
    }
  }, [locationsError, toast]);

  const { fetchNextPage } = locationsQuery;
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || tab !== 'locations') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchNextPage, tab]);

  return (
    <div className="py-12 px-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Layanan <span className="text-primary">Konsultasi & Terapi</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Temukan terapis profesional untuk konsultasi langsung, atau cari lokasi terapi terdekat
          </p>
        </div>

        {/* Banner orang tua baru */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-amber-900 text-sm">Baru pertama kali mencari terapis?</p>
            <p className="text-sm text-amber-700 mt-0.5">Pelajari cara memilih terapis yang tepat untuk kebutuhan anak Anda.</p>
          </div>
          <a href="/cara-kerja" className="flex-shrink-0 text-sm bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors font-medium">
            Pelajari Cara Kerja
          </a>
        </div>

        {/* Tab Switch */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            <button
              onClick={() => setTab('therapists')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'therapists'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Stethoscope size={16} />
              Terapis
            </button>
            <button
              onClick={() => setTab('locations')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'locations'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 size={16} />
              Lokasi Terapi
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={tab === 'locations' ? 'md:col-span-2' : 'md:col-span-3'}>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                {tab === 'therapists' ? 'Cari Terapis' : 'Cari Lokasi Terapi'}
              </label>
              <Input
                id="search"
                type="text"
                placeholder={tab === 'therapists' ? 'Nama terapis, spesialisasi, kota...' : 'Nama lokasi, alamat, kota...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            {tab === 'locations' && (
              <div>
                <label htmlFor="filter-tipe-lokasi" className="block text-sm font-medium text-gray-700 mb-2">Tipe</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="filter-tipe-lokasi"><SelectValue placeholder="Semua Tipe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    {locationTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Filter akses: metode konsultasi, biaya, BPJS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <label htmlFor="filter-metode" className="block text-sm font-medium text-gray-700 mb-2">Metode Konsultasi</label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger id="filter-metode"><SelectValue placeholder="Semua Metode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Metode</SelectItem>
                  {consultMethods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="filter-biaya" className="block text-sm font-medium text-gray-700 mb-2">Biaya per Sesi</label>
              <Select value={maxRate} onValueChange={setMaxRate}>
                <SelectTrigger id="filter-biaya"><SelectValue placeholder="Semua Harga" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Harga</SelectItem>
                  {rateOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2.5 cursor-pointer select-none bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 rounded-lg px-4 py-2.5 w-full">
                <input
                  type="checkbox"
                  checked={bpjsOnly}
                  onChange={(e) => setBpjsOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Menerima BPJS</span>
              </label>
            </div>
          </div>
        </div>

        {/* Result Count */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {tab === 'therapists'
              ? `${total} Terapis Tersedia`
              : `${total} Lokasi Terapi`}
          </h2>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        ) : tab === 'therapists' ? (
          /* === TERAPIS GRID === */
          therapists.length === 0 ? (
            <div className="text-center py-16 max-w-md mx-auto">
              <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum ada terapis independen</h3>
              <p className="text-gray-500 text-sm mb-6">Terapis independen sedang dalam proses pendaftaran. Sementara itu, temukan layanan terapi di tab <strong>Lokasi Terapi</strong>.</p>
              <button
                onClick={() => setTab('locations')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Building2 size={16} />
                Lihat Lokasi Terapi
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {therapists.map((t) => (
                <TherapistCard key={t.id} therapist={t} />
              ))}
            </div>
          )
        ) : (
          /* === LOKASI GRID === */
          locations.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Tidak ada lokasi yang ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((loc) => (
                <LocationCard key={loc.id} location={loc} />
              ))}
            </div>
          )
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="py-4 text-center">
          {loadingMore && (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" /><span>Memuat lebih banyak...</span>
            </div>
          )}
          {tab === 'locations' && !hasMore && locations.length > 0 && (
            <p className="text-sm text-gray-500">Semua lokasi telah ditampilkan</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==================== TERAPIS CARD ==================== */
function TherapistCard({ therapist: t }: { therapist: TherapyProvider }) {
  const navigate = useNavigate();
  const isIndependent = t.role === 'therapist_independent';

  return (
    <Card className="hover:shadow-lg transition-shadow border border-gray-200 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            isIndependent ? 'bg-primary/10' : 'bg-blue-50'
          }`}>
            <User className={`w-6 h-6 ${isIndependent ? 'text-primary' : 'text-blue-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold text-gray-900 truncate">
              {t.full_name || t.email}
            </CardTitle>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              <Badge variant={isIndependent ? 'default' : 'secondary'} className="text-xs">
                {isIndependent ? 'Terapis Independen' : 'Pemilik Yayasan/Klinik'}
              </Badge>
              {t.is_verified && (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs flex items-center gap-1">
                  <CheckCircle size={10} /> Terverifikasi
                </Badge>
              )}
              {t.bpjs_accepted && (
                <Badge className="bg-teal-100 text-teal-800 border-teal-200 text-xs">BPJS</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 flex-1 flex flex-col">
        {t.specialization && (
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <Briefcase size={13} className="text-primary flex-shrink-0" />
              <span className="text-xs font-medium text-gray-500">Spesialisasi</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {t.specialization.split(',').slice(0, 3).map((s) => (
                <span key={s.trim()} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5">
                  {s.trim()}
                </span>
              ))}
              {t.specialization.split(',').length > 3 && (
                <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5">
                  +{t.specialization.split(',').length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {t.city && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin size={14} className="mr-2 text-gray-500 flex-shrink-0" />
            <span>{t.city}{t.district ? `, ${t.district}` : ''}</span>
          </div>
        )}

        {t.experience_years != null && t.experience_years > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <Clock size={14} className="mr-2 text-gray-500 flex-shrink-0" />
            <span>{t.experience_years} tahun pengalaman</span>
          </div>
        )}

        {formatRateRange(t.rate_min, t.rate_max, t.rate_per_session) && (
          <div className="flex items-center text-sm">
            <DollarSign size={14} className="mr-2 text-green-500 flex-shrink-0" />
            <span className="font-semibold text-green-700">{formatRateRange(t.rate_min, t.rate_max, t.rate_per_session)}<span className="font-normal text-gray-500">/sesi</span></span>
          </div>
        )}

        {t.consultation_methods && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Metode konsultasi:</p>
            <div className="flex flex-wrap gap-1">
              {t.consultation_methods.split(',').map((m) => {
                const method = m.trim().toLowerCase();
                const Icon = methodIcons[method] || Heart;
                return (
                  <Badge key={m.trim()} variant="outline" className="text-xs gap-1">
                    <Icon size={10} />
                    {methodLabels[method] || m.trim()}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {t.bio && (
          <p className="text-sm text-gray-600 line-clamp-2">{t.bio}</p>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            className="flex-1 border-primary text-primary hover:bg-primary/5 text-sm"
            onClick={() => navigate({ to: '/terapis/$id', params: { id: t.id } })}
          >
            <User size={14} className="mr-1.5" />
            Profil
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-white text-sm"
            onClick={() => navigate({ to: '/terapis/$id', params: { id: t.id }, search: { tab: 'jadwal' } })}
          >
            <Calendar size={14} className="mr-1.5" />
            Buat Janji
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ==================== LOKASI CARD ==================== */
const dayNamesShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function LocationCard({ location: loc }: { location: TherapyLocationPublic }) {
  return (
    <Card className="hover:shadow-lg transition-shadow border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-gray-900 mb-1">{loc.name}</CardTitle>
            <p className="text-sm text-primary font-medium">{loc.type_label}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {loc.is_verified && (
              <Badge className="bg-green-100 text-green-800 text-xs flex items-center gap-1">
                <CheckCircle size={10} /> Terverifikasi
              </Badge>
            )}
            {loc.bpjs_accepted && (
              <Badge className="bg-teal-100 text-teal-800 border-teal-200 text-xs">BPJS</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {loc.contact_locked ? (
          <>
            <div className="flex items-start text-sm text-gray-600">
              <MapPin size={14} className="mr-2 mt-0.5 text-gray-500 flex-shrink-0" />
              <span className="line-clamp-2">{loc.city_name || 'Lokasi tersedia setelah daftar'}</span>
            </div>
            <Link
              to="/auth"
              className="flex items-center text-sm text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Lock size={14} className="mr-2 flex-shrink-0" />
              <span>Daftar gratis untuk lihat alamat &amp; kontak</span>
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-start text-sm text-gray-600">
              <MapPin size={14} className="mr-2 mt-0.5 text-gray-500 flex-shrink-0" />
              <span className="line-clamp-2">{loc.address}{loc.city_name ? `, ${loc.city_name}` : ''}</span>
            </div>
          </>
        )}

        {formatRateRange(loc.rate_min, loc.rate_max) && (
          <div className="flex items-center text-sm">
            <DollarSign size={14} className="mr-2 text-green-500 flex-shrink-0" />
            <span className="font-semibold text-green-700">{formatRateRange(loc.rate_min, loc.rate_max)}<span className="font-normal text-gray-500">/sesi</span></span>
          </div>
        )}

        {loc.consultation_methods && (
          <div className="flex flex-wrap gap-1">
            {loc.consultation_methods.split(',').map((m) => {
              const method = m.trim().toLowerCase();
              const Icon = methodIcons[method] || Heart;
              return (
                <Badge key={m.trim()} variant="outline" className="text-xs gap-1">
                  <Icon size={10} />
                  {methodLabels[method] || m.trim()}
                </Badge>
              );
            })}
          </div>
        )}

        {loc.services && loc.services.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {loc.services.slice(0, 3).map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
            ))}
            {loc.services.length > 3 && (
              <Badge variant="secondary" className="text-xs">+{loc.services.length - 3}</Badge>
            )}
          </div>
        )}

        {loc.open_hours && loc.open_hours.length > 0 && (
          <div className="text-xs text-gray-500">
            <Clock size={12} className="inline mr-1" />
            {[...loc.open_hours]
              .sort((a, b) => a.day_of_week - b.day_of_week)
              .slice(0, 3)
              .map((h) => `${dayNamesShort[h.day_of_week]} ${h.open_time}-${h.close_time}`)
              .join(' · ')}
            {loc.open_hours.length > 3 && ' ...'}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full border-primary text-primary hover:bg-primary/5 mt-2 text-sm"
          // Route `/lokasi-terapi/:id` sudah tidak ada sejak nav lokasi terapi
          // dipangkas, jadi tujuannya tidak dikenal router. Dibiarkan navigasi
          // penuh supaya perilakunya sama persis dengan sebelum migrasi (404),
          // bukan diam-diam diarahkan ke halaman lain.
          onClick={() => { window.location.href = `/lokasi-terapi/${loc.id}`; }}
        >
          <Building2 size={14} className="mr-1.5" />
          Lihat Detail Lokasi
        </Button>
      </CardContent>
    </Card>
  );
}

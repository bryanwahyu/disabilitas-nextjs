
import { useState, useEffect, useMemo, useRef } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { qk } from '@/lib/query/keys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, Phone, Globe, Mail, Loader2, Clock, ArrowRight, Wifi, Home, Building2, ShieldCheck, Lock } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useToast } from '@/hooks/use-toast';
import { env } from '@/lib/env';

const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface OpenHour {
  day_of_week: number;
  open_time: string;
  close_time: string;
}

interface TherapyLocation {
  id: string;
  name: string;
  type: string | null;
  type_label: string;
  address: string;
  city_name: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_verified: boolean;
  bpjs_accepted: boolean;
  contact_locked?: boolean;
  consultation_methods: string | null;
  rate_min: number | null;
  rate_max: number | null;
  services: string[];
  open_hours?: OpenHour[];
}

const PAGE_SIZE = 12;

interface TherapyLocationFinderProps {
  /** Jika diset, tampilkan hanya sejumlah ini tanpa search/filter/infinite scroll */
  previewLimit?: number;
}

interface LocationPage {
  items: TherapyLocation[];
  total: number;
}

/**
 * Endpoint publik ini tidak tersedia di `apiClient` (butuh header Authorization
 * opsional untuk contact gating), jadi fetch-nya tetap manual di dalam queryFn.
 */
async function fetchLocationPage(params: {
  offset: number;
  limit: number;
  search: string;
  type: string;
  method: string;
  bpjs: boolean;
}): Promise<LocationPage> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.type !== 'all') qs.set('type', params.type);
  if (params.method !== 'all') qs.set('method', params.method);
  if (params.bpjs) qs.set('bpjs', 'true');
  qs.set('limit', String(params.limit));
  qs.set('offset', String(params.offset));

  const baseUrl = env.apiBaseUrl;
  const tokenKey = env.authTokenKey;
  const token = typeof window !== 'undefined' ? localStorage.getItem(tokenKey) : null;
  const res = await fetch(`${baseUrl}/public/therapists?${qs.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error('Gagal memuat data lokasi');
  const json = await res.json();

  return {
    items: Array.isArray(json.data) ? (json.data as TherapyLocation[]) : [],
    total: json.meta?.total ?? 0,
  };
}

const TherapyLocationFinder = ({ previewLimit }: TherapyLocationFinderProps = {}) => {
  const isPreview = previewLimit !== undefined;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [bpjsOnly, setBpjsOnly] = useState(false);
  const { toast } = useToast();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const locationTypes = [
    { value: 'yayasan', label: 'Yayasan' },
    { value: 'klinik', label: 'Klinik' },
    { value: 'rumah_sakit', label: 'Rumah Sakit' },
    { value: 'praktek_mandiri', label: 'Praktek Mandiri' },
    { value: 'puskesmas', label: 'Puskesmas' },
    { value: 'lainnya', label: 'Lainnya' },
  ];

  // Ketikan pencarian ditahan 400ms supaya tiap huruf tidak jadi satu request.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const pageSize = isPreview ? previewLimit ?? PAGE_SIZE : PAGE_SIZE;

  const {
    data,
    isPending: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteQuery({
    queryKey: qk.therapists.list({
      search: debouncedSearch,
      type: selectedType,
      method: selectedMethod,
      bpjs: bpjsOnly,
      limit: pageSize,
    }),
    queryFn: ({ pageParam }) =>
      fetchLocationPage({
        offset: pageParam,
        limit: pageSize,
        search: debouncedSearch,
        type: selectedType,
        method: selectedMethod,
        bpjs: bpjsOnly,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.items.length, 0);
      // Halaman kosong = berhenti, supaya tidak memanggil offset yang sama terus.
      if (lastPage.items.length === 0 || loaded >= lastPage.total) return undefined;
      return loaded;
    },
    // Ganti filter tidak mengosongkan layar; filter yang pernah dibuka kembali instan.
    placeholderData: keepPreviousData,
  });

  const locations = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;
  const hasMore = !!hasNextPage;

  useEffect(() => {
    if (!isError) return;
    toast({
      title: 'Error',
      description: 'Gagal memuat data lokasi',
      variant: 'destructive',
    });
  }, [isError, toast]);

  // Infinite scroll — hanya aktif di mode full (bukan preview)
  useEffect(() => {
    if (isPreview) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

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
  }, [isPreview, hasMore, loading, loadingMore, fetchNextPage]);

  const locationCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {locations.map((loc) => (
        <Card key={loc.id} className="hover:shadow-lg transition-shadow duration-300 border border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                  {loc.name}
                </CardTitle>
                <CardDescription className="text-primary font-medium">
                  {loc.type_label}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-1 items-end">
                {loc.is_verified && (
                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                    <CheckCircle size={12} />
                    Terverifikasi
                  </div>
                )}
                {loc.bpjs_accepted && (
                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                    <ShieldCheck size={12} />
                    BPJS
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {loc.contact_locked ? (
              <>
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin size={16} className="mr-2 mt-0.5 text-gray-500 flex-shrink-0" aria-hidden="true" />
                  <span>{loc.city_name || 'Lokasi tersedia setelah daftar'}</span>
                </div>
                <Link to="/auth" className="flex items-center text-sm text-primary hover:underline">
                  <Lock size={14} className="mr-2 flex-shrink-0" aria-hidden="true" />
                  <span>Daftar gratis untuk lihat alamat &amp; kontak</span>
                </Link>
                {loc.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe size={14} className="mr-2 text-gray-500" aria-hidden="true" />
                    <a href={loc.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                      {loc.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </>
            ) : (
            <>
            <div className="flex items-start text-sm text-gray-600">
              <MapPin size={16} className="mr-2 mt-0.5 text-gray-500 flex-shrink-0" aria-hidden="true" />
              <span>{loc.address}{loc.city_name ? `, ${loc.city_name}` : ''}</span>
            </div>

            {(loc.phone || loc.email || loc.website) && (
              <div className="space-y-2 text-sm text-gray-600">
                {loc.phone && (
                  <div className="flex items-center">
                    <Phone size={14} className="mr-2 text-gray-500" aria-hidden="true" />
                    <span>{loc.phone}</span>
                  </div>
                )}
                {loc.email && (
                  <div className="flex items-center">
                    <Mail size={14} className="mr-2 text-gray-500" aria-hidden="true" />
                    <span>{loc.email}</span>
                  </div>
                )}
                {loc.website && (
                  <div className="flex items-center">
                    <Globe size={14} className="mr-2 text-gray-500" aria-hidden="true" />
                    <a href={loc.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                      {loc.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            )}

            {loc.description && (
              <div className="text-sm text-gray-600">
                <p className="line-clamp-2">{loc.description}</p>
              </div>
            )}

            {loc.services && loc.services.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700">Layanan:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {loc.services.slice(0, 3).map((service) => (
                    <Badge key={service} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                  {loc.services.length > 3 && (
                    <Badge variant="outline" className="text-xs text-gray-500">
                      +{loc.services.length - 3} lainnya
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {loc.open_hours && loc.open_hours.length > 0 && (
              <div className="text-sm">
                <div className="flex items-center text-gray-700 mb-1">
                  <Clock size={14} className="mr-1.5 text-gray-500" aria-hidden="true" />
                  <span className="font-medium">Jam Buka:</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-gray-600">
                  {[...loc.open_hours]
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((h, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="font-medium">{dayNames[h.day_of_week]}</span>
                        <span>{h.open_time}-{h.close_time}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary/5 focus:ring-2 focus:ring-primary"
                aria-label={`Lihat detail ${loc.name}`}
                onClick={() => navigate({ to: `/lokasi-terapi/${loc.id}` })}
              >
                <MapPin size={16} className="mr-2" />
                Lihat Detail
              </Button>
            </div>
            </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <section id="layanan" className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Temukan <span className="text-primary">Lokasi Terapi</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {isPreview
              ? `${total > 0 ? `${total.toLocaleString('id-ID')}+` : ''} lokasi terapi tersedia di seluruh Indonesia`
              : 'Cari lokasi terapi yang sesuai dengan kebutuhan dan lokasi Anda'}
          </p>
        </div>

        {/* Search dan filter — hanya di mode full */}
        {!isPreview && (
          <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="search-therapist" className="block text-sm font-medium text-gray-700 mb-2">
                  Cari Lokasi Terapi
                </label>
                <Input
                  id="search-therapist"
                  type="text"
                  placeholder="Nama lokasi, alamat, atau kota..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full focus:ring-2 focus:ring-primary focus:border-primary"
                  aria-label="Cari lokasi terapi berdasarkan nama, alamat, atau kota"
                />
              </div>
              <div>
                <label htmlFor="type-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Lokasi
                </label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="type-select" aria-label="Pilih tipe lokasi terapi" className="focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    {locationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-6">
          {!isPreview && (
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                Hasil Pencarian ({total} lokasi)
              </h3>
              {locations.length > 0 && (
                <p className="text-sm text-gray-500">
                  Menampilkan {locations.length} dari {total}
                </p>
              )}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat data lokasi...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Tidak ada lokasi yang ditemukan.</p>
            </div>
          ) : (
            <>
              {locationCards}

              {isPreview ? (
                /* Tombol Lihat Semua di preview mode */
                <div className="text-center pt-4">
                  <Button
                    size="lg"
                    onClick={() => navigate({ to: '/terapis' })}
                    className="bg-primary hover:bg-primary/90 text-white px-10 rounded-full shadow-md shadow-primary/20"
                  >
                    Lihat Semua {total > 0 && `${total.toLocaleString('id-ID')}+`} Lokasi Terapi
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              ) : (
                /* Infinite scroll sentinel di full mode */
                <div ref={sentinelRef} className="py-8 text-center">
                  {loadingMore && (
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Memuat lebih banyak...</span>
                    </div>
                  )}
                  {!hasMore && locations.length > 0 && (
                    <p className="text-sm text-gray-600">Semua lokasi telah ditampilkan</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default TherapyLocationFinder;
